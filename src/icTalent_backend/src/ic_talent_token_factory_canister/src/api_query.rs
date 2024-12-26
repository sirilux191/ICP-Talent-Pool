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
    if caller == STATE.with(|state| state.borrow().admin) {
        return Err("Not authorized".to_string());
    }
    STATE.with(|state| {
        let faucet_request = state.borrow().faucet_requests.iter().map(|(request_sender, request)| (request_sender, request)  ).collect()    ;
        Ok(faucet_request)
    })
}

#[ic_cdk::query]
pub async fn get_list_of_tokens() -> Result<Vec<(Principal, TokenMetadata)>, String> {
    STATE.with(|state| {
        let tokens = state.borrow().tokens.iter().map(|(token_id, metadata)| (token_id, metadata.clone())).collect();
        Ok(tokens)
    })
}



// #[ic_cdk::query]
// pub fn list_tokens() -> Vec<(Principal, TokenMetadata)> {
//     STATE.with(|state| {
//         state.borrow().tokens.iter()
//             .map(|(k, v)| (*k, v.clone()))
//             .collect()
//     })
// } 