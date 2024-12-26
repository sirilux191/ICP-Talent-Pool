use candid::{Nat, Principal,encode_args,  Encode};
use crate::types::*;
use ic_cdk::api::management_canister::main::{
    CreateCanisterArgument, CanisterIdRecord, CanisterSettings, CanisterInstallMode, InstallCodeArgument,
};
use crate::state_handler::{STATE, WASM_MODULE};
use ic_cdk::api::caller;
use icrc_ledger_types::icrc1::account::Account;
#[ic_cdk::update]
pub async fn update_wasm_module(wasm: Vec<u8>) -> Result<String, String> {
    // Check if caller is admin
    STATE.with(|state| {
        let state = state.borrow();
        if state.admin != caller() {
            return Err("Unauthorized: Only admin can update WASM module".to_string());
        }
        Ok(())
    })?;

    // Update WASM module
    WASM_MODULE.with(|module| {
        let mut module = module.borrow_mut();
        *module = wasm;
    });

    Ok("WASM module updated successfully.".to_string())
}

#[ic_cdk::update]
async fn create_talent_token_canister(token_args: CreateTokenArgs, token_creator: Principal) -> Result<Principal, String> {
   
    
    WASM_MODULE.with(|wasm| {
        if wasm.borrow().is_empty() {
            return Err("WASM module not set".to_string());
        }
        Ok(())
    })?;

    let settings = CanisterSettings {
        controllers: Some(vec![ic_cdk::id(), token_creator]),
        compute_allocation: Some(Nat::from(0_u64)),
        memory_allocation: Some(Nat::from(0_u64)),
        freezing_threshold: Some(Nat::from(0_u64)),
        log_visibility: None,
        reserved_cycles_limit: None,
        wasm_memory_limit: None,
    };

    let create_args = CreateCanisterArgument {
        settings: Some(settings)
    };

    let (canister_id,): (CanisterIdRecord,) = ic_cdk::api::call::call(
        Principal::management_canister(),
        "create_canister",
        (create_args,)
    ).await.map_err(|_e| "Creation failed".to_string())?;

    let wasm_module = WASM_MODULE.with(|w| w.borrow().clone());
    
    // Create initialization args matching the Candid file structure
    let init_args = InitArgs {
        token_symbol: token_args.symbol.clone(),
        token_name: token_args.name.clone(),
        minting_account: Account {
            owner: token_creator,
            subaccount: None,
        },
        transfer_fee: Nat::from(0u64),
        metadata: vec![],
        initial_balances: vec![(
            Account {
                owner: token_creator,
                subaccount: None,
            },
            Nat::from(token_args.total_supply),
        )],
        archive_options: ArchiveOptions {
            num_blocks_to_archive: Nat::from(1000u64),
            trigger_threshold: Nat::from(2000u64),
            controller_id: token_creator,
            cycles_for_archive_creation: Some(Nat::from(10_000_000_000_000u64)),
        },
        feature_flags: Some(FeatureFlags { icrc2: true }),
    };

    let install_args = Encode!(&init_args).map_err(|e| format!("Failed to encode args: {}", e))?;

    let install_config = InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id: canister_id.canister_id,
        wasm_module,
        arg: install_args
    };

    let _: () = ic_cdk::api::call::call(
        Principal::management_canister(),
        "install_code",
        (install_config,)
    ).await.map_err(|_e| "Creation failed".to_string())?;

    let metadata = TokenMetadata {
        name: token_args.name,
        symbol: token_args.symbol,
        decimals: token_args.decimals,
        total_supply: token_args.total_supply,
        owner: token_creator,
        logo: token_args.logo,
        created: ic_cdk::api::time(),
    };

    STATE.with(|state| {
        state.borrow_mut().tokens.insert(canister_id.canister_id, metadata);
    });

    STATE.with(|state| {
        state.borrow_mut().talent_token_map.insert(token_creator, canister_id.canister_id);
    });

    Ok(canister_id.canister_id)
}

#[ic_cdk::update]
pub async fn create_talent_token(token_args: CreateTokenArgs) -> Result<Principal, String> {
    let token_creator = caller();

    create_talent_token_canister(token_args, token_creator).await.map_err(|e| e.to_string())
}
