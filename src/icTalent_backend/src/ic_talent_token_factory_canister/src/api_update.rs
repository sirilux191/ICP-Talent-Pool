
use candid::{Nat,Principal};
use crate::state_handler::STATE;
use crate::types::*;
use icrc_ledger_types::icrc1::transfer::*;
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc2::transfer_from::TransferFromArgs;

#[ic_cdk::update]

pub fn send_token_faucet_request(number_of_tokens: u32) -> Result<String, String> {
    let caller = ic_cdk::caller();

    if caller == Principal::anonymous() {
        return Err("You are not allowed to request tokens".to_string());
    };

    STATE.with(|state| {
        
        let faucet_request = state.borrow().faucet_requests.get(&caller).unwrap_or(FaucetTokenRequest {
            current_token_request: number_of_tokens,
            total_number_of_request: 0,
            total_token_given: 0,
        });

        let new_faucet_request = FaucetTokenRequest {
            current_token_request: number_of_tokens,
            total_number_of_request: faucet_request.total_number_of_request + 1,
            total_token_given: faucet_request.total_token_given,
        };

        state.borrow_mut().faucet_requests.insert(caller, new_faucet_request);
    });

    Ok(format!("Faucet request sent for {} tokens", number_of_tokens))
}


#[ic_cdk::update]
pub fn register_admin() -> Result<String, String> {
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        
        // Check if admin is already registered
        if state.is_admin_registered {
            return Err("Admin already registered".to_string());
        }
        
        // Set the caller as admin
        state.admin = ic_cdk::caller();
        state.is_admin_registered = true;
        
        Ok("Admin registered".to_string())
    })
}

#[ic_cdk::update]
pub fn change_admin(new_admin: Principal) -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    STATE.with(|state| {
        let state = state.borrow();
        
        // Check if admin is registered
        if !state.is_admin_registered {
            return Err("Admin not registered".to_string());
        }
        
        // Check if caller is current admin
        if caller != state.admin {
            return Err("Not authorized".to_string());
        }
        
        Ok(())
    })?;

    STATE.with(|state| {
        state.borrow_mut().admin = new_admin;
    });

    Ok("Admin changed successfully".to_string())
}

#[ic_cdk::update]
    pub async fn accept_token_request(user: Principal) -> Result<String, Error> {
    let caller = ic_cdk::caller();
    
    STATE.with(|state| {
        let state = state.borrow();
        if caller != state.admin {
            return Err(Error::NotAuthorized);
        }
        
        if !state.faucet_requests.contains_key(&user) {
            return Err(Error::RequestNotFound);
        }
        Ok(())
    })?;

    // Get request details and update stats
    let request = STATE.with(|state| {
        let mut state = state.borrow_mut();
        let mut request = state.faucet_requests.get(&user).unwrap();
        request.total_number_of_request += 1u32;
        request.total_token_given += request.current_token_request as u64;
        state.faucet_requests.insert(user, request.clone());
        request
    });

    // Trigger token transfer
    transfer_tokens(user, request.current_token_request, caller).await.map_err(|e| e)?;

    Ok("Request accepted".to_string())
}

#[ic_cdk::update]
pub async fn reject_token_request(user: Principal) -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    STATE.with(|state| {
        let state = state.borrow();
        if caller != state.admin {
            return Err("Not authorized".to_string());
        }
        
        if !state.faucet_requests.contains_key(&user) {
            return Err("Request not found".to_string());
        }        
        Ok(())
    })?;

    STATE.with(|state| {
        state.borrow_mut().faucet_requests.remove(&user);
    });

    Ok("Request rejected".to_string())
}

#[ic_cdk::update]
async fn transfer_tokens(to: Principal, amount: u32, admin: Principal) -> Result<(), Error> {
    let token_canister = STATE.with(|state| state.borrow().token_canister_id);
   
    let transfer_from_args = TransferFromArgs {
        from: Account::from(admin),
        to: Account {
            owner: to,
            subaccount: None,
        },
        amount: Nat::from(amount),
        fee: None,
        memo: None,
        created_at_time: None,
        spender_subaccount: None,
    };

    let (transfer_result,): (Result<Nat, TransferError>,) = ic_cdk::api::call::call(
        token_canister,
        "icrc2_transfer_from",
        (transfer_from_args,),
    ).await.map_err(|e| Error::TransferFailed(format!("Transfer failed: {}", e.1)))?;

    transfer_result.map_err(|e: _| Error::TransferFailed(format!("Transfer error: {:?}", e)))?;

    Ok(())
} 


