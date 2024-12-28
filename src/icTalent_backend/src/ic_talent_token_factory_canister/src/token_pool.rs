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
use icrc_ledger_types::icrc1::transfer::{TransferArg, TransferError, BlockIndex};

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
            Nat::from(0u64),
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
    let token = LedgerArg::Init(init_args);
    let serialized_args = Encode!(&token).expect("Serialization failed");
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
        token_price: token_args.token_price,
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
pub async fn buy_talent_token(canister_id: Principal, quantity: u32) -> Result<String, String> {
    let buyer = caller();
    
    // Get token metadata
    let token_metadata = STATE.with(|state| {
        state.borrow().tokens.get(&canister_id)
            .ok_or_else(|| "Token not found".to_string())
    })?;
    
    // Calculate total cost (token_price * quantity)
    let total_cost = (token_metadata.token_price as u32) * quantity;
    
    // Transfer tokens from buyer to token owner
    let transfer_result = transfer_tokens(token_metadata.owner, total_cost).await;
    if let Err(e) = transfer_result {
        return Err(format!("Failed to transfer payment: {}", e));
    }

    // Create transfer args for the buying token
    let transfer_args = TransferArg {
        from_subaccount: None,
        to: Account {
            owner: buyer,
            subaccount: None,
        },
        amount: Nat::from(quantity as u64),
        fee: None,
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    // Call the token canister to transfer tokens to buyer
    match ic_cdk::api::call::call::<(TransferArg,), (Result<BlockIndex, TransferError>,)>(canister_id, "icrc1_transfer", (transfer_args,)).await {
        Ok((result,)) => {
            match result {
                Ok(_) => {
                    // Update purchase history after successful transfer
                    STATE.with(|state| {
                        let mut state = state.borrow_mut();
                        let mut history = state.purchase_history
                            .get(&buyer)
                            .map(|h| h.0.clone())
                            .unwrap_or_default();
                        
                        if !history.contains(&canister_id) {
                            history.push(canister_id);
                            state.purchase_history.insert(buyer, PrincipalVec(history));
                        }
                    });
                    
                    Ok("Token purchase successful".to_string())
                },
                Err(e) => Err(format!("Token transfer failed: {:?}", e)),
            }
        },
        Err((code, msg)) => Err(format!("Call failed: code={:?}, msg={}", code, msg)),
    }
}

#[ic_cdk::update]
pub async fn get_total_supply(token_canister_id: Principal) -> Result<Nat, String> {
    
    
    // Check if the token exists
    STATE.with(|state| {
        if !state.borrow().tokens.contains_key(&token_canister_id) {
            return Err("Token not found".to_string());
        }
        Ok(())
    })?;

    
    // Call the token canister to get total supply
    match ic_cdk::api::call::call(
        token_canister_id,
        "icrc1_total_supply",
        ()
    ).await {
        Ok((balance,)) => Ok(balance),
        Err((code, msg)) => Err(format!("Failed to get balance: code={:?}, msg={}", code, msg))
    }
}

// Optional: Get balances for all tokens owned by the user
#[ic_cdk::update]
pub async fn get_all_token_balances() -> Result<Vec<(Principal, Nat)>, String> {
    let caller = ic_cdk::caller();
    
    // Get list of tokens purchased by the user
    let purchased_tokens = STATE.with(|state| {
        state.borrow()
            .purchase_history
            .get(&caller)
            .map(|h| h.0.clone())
            .unwrap_or_default()
    });

    let mut balances = Vec::new();
    
    // Create account struct for the caller
    let account = Account {
        owner: caller,
        subaccount: None,
    };

    // Get balance for each token
    for token_id in purchased_tokens {
        match ic_cdk::api::call::call(
            token_id,
            "icrc1_balance_of",
            (account,)
        ).await {
            Ok((balance,)) => balances.push((token_id, balance)),
            Err(_) => continue // Skip tokens that fail to respond
        }
    }

    Ok(balances)
}


