use crate::state_handler::STATE;
use crate::types::*;
use candid::Principal;

#[ic_cdk::query]
pub async fn get_token_metadata(token_id: Principal) -> Result<TokenMetadata, String> {
    STATE.with(|state| {
        state.borrow().tokens.get(&token_id)
            .ok_or("Token not found".to_string())
            .map(|metadata| metadata.clone())
    })
}
#[ic_cdk::query]
pub async fn get_faucet_requests() -> Result<Vec<( Principal, FaucetTokenRequest)>, String> {
    let caller = ic_cdk::caller();
    if caller != STATE.with(|state| state.borrow().admin) {
        return Err(format!("Not authorized, caller: {}", caller.to_text()).to_string());
    }
    STATE.with(|state| {
        let faucet_requests = state.borrow().faucet_requests.iter().map(|(request_sender, request)| (request_sender, request)  ).collect()    ;
        Ok(faucet_requests)
    })
}

#[ic_cdk::query]
pub async fn get_list_of_tokens() -> Result<Vec<(Principal, TokenMetadata)>, String> {
    STATE.with(|state| {
        let tokens = state.borrow().tokens.iter().map(|(token_id, metadata)| (token_id, metadata.clone())).collect();
        Ok(tokens)
    })
}

#[ic_cdk::query]
pub async fn get_admin() -> Result<Principal, String> {
    STATE.with(|state| {
        Ok(state.borrow().admin)
    })
}

#[ic_cdk::query]
pub async fn get_user_token_metadata() -> Result<(Principal, TokenMetadata), String> {
    let user = ic_cdk::caller();
    STATE.with(|state| {
        let state = state.borrow();
        // First get the token principal from talent_token_map
        match state.talent_token_map.get(&user) {
            Some(token_id) => {
                // Then get the token metadata
                match state.tokens.get(&token_id) {
                    Some(metadata) => Ok((token_id, metadata.clone())),
                    None => Err("Token metadata not found for existing token mapping".to_string())
                }
            },
            None => Err("User hasn't created a token yet".to_string())
        }
    })
}

