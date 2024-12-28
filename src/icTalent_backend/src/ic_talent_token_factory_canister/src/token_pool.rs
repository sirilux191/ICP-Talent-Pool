use candid::{Nat, Principal, Encode};
use crate::types::*;
use ic_cdk::api::management_canister::main::{
    CreateCanisterArgument, CanisterIdRecord, CanisterSettings, CanisterInstallMode, InstallCodeArgument,
};
use crate::api_update::transfer_tokens;
use crate::state_handler::{STATE, WASM_MODULE};
use ic_cdk::api::caller;
use icrc_ledger_types::icrc1::account::Account;

use icrc_ledger_types::icrc::generic_value::Value;

use hex;




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
async fn create_talent_token_canister(token_args: CreateTokenArgs) -> Result<Principal, String> {
    let token_creator = caller();
    
    // Check if user has already created a token
    STATE.with(|state| {
        let state = state.borrow();
        if state.talent_token_map.contains_key(&token_creator) {
            return Err("You can only create one token".to_string());
        }
        Ok(())
    })?;

    // Charge 100 tokens for token creation
    let token_charge = 100u32;

    
    // Transfer tokens from creator to factory canister
    let transfer_result = transfer_tokens(STATE.with(|state| state.borrow().admin), token_charge).await;
    if let Err(e) = transfer_result {
        return Err(format!("Failed to charge tokens: {}", e));
    }

    // Rest of the existing create_talent_token_canister code...
    WASM_MODULE.with(|wasm| {
        if wasm.borrow().is_empty() {
            return Err("WASM module not set".to_string());
        }
        Ok(())
    })?;

    let settings = CanisterSettings {
        controllers: Some(vec![ic_cdk::id(), token_creator]),
        compute_allocation: None,
        memory_allocation: None,
        freezing_threshold: None,
        log_visibility: None,
        reserved_cycles_limit: None,
        wasm_memory_limit: None,
    };

    let create_args = CreateCanisterArgument {
        settings: Some(settings)
    };

  
    let (canister_id,): (CanisterIdRecord,) = ic_cdk::api::call::call_with_payment(
        Principal::management_canister(),
        "create_canister",
        (create_args,),
        20_000_000_000
    ).await.map_err(|e| format!("Creation failed: {:?}", e))?;

    let wasm_module = WASM_MODULE.with(|w| w.borrow().clone());
    
    // Updated initialization args
    let init_args = InitArgs {
        minting_account: Account {
            owner: ic_cdk::id(),
            subaccount: None,
        },
        fee_collector_account: Some(Account {
            owner: token_creator,
            subaccount: None,
        }),
        transfer_fee: Nat::from(0u64),
        token_symbol: token_args.symbol.clone(),
        token_name: token_args.name.clone(),
        metadata: vec![
            ("icrc1:name".to_string(), Value::Text(token_args.name.clone())),
            ("icrc1:symbol".to_string(), Value::Text(token_args.symbol.clone())),
            ("icrc1:decimals".to_string(), Value::Nat(Nat::from(token_args.decimals as u64))),
        ],
        initial_balances: vec![(
            Account {
                owner: ic_cdk::id(),
                subaccount: None,
            },
            Nat::from(token_args.total_supply),
        )],
        feature_flags: Some(FeatureFlags {
            icrc2: true,
        }),
        maximum_number_of_accounts: Some(1_000_000),
        accounts_overflow_trim_quantity: Some(100_000),
        archive_options: ArchiveOptions {
            num_blocks_to_archive: 2000,
            trigger_threshold: 1000,
            max_message_size_bytes: Some(1024 * 1024),
            cycles_for_archive_creation: Some(10_000_000_000_000),
            node_max_memory_size_bytes: Some(3 * 1024 * 1024 * 1024),
            controller_id: ic_cdk::id(),
            more_controller_ids: Some(vec![token_creator]),
            max_transactions_per_response: Some(100),
        },
        decimals: Some(token_args.decimals as u8),
        max_memo_length: Some(256),
    };
    let serialized_args = Encode!(&init_args).unwrap();
    
    // Debug print the hex representation of serialized args
    ic_cdk::println!("Serialized args (hex): {}", hex::encode(&serialized_args));

    let install_config = InstallCodeArgument {
        mode: CanisterInstallMode::Install,
        canister_id: canister_id.canister_id,
        wasm_module,
        arg: serialized_args
    };

    let _: () = ic_cdk::api::call::call(
        Principal::management_canister(),
        "install_code",
        (install_config,)
    ).await.map_err(|e| format!("Creation failed: {:?}", e))?;

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


