use crate::types::*;
use ic_cdk::caller;
use crate::state_handler::STATE;
use candid::Principal;

#[ic_cdk::query]
pub fn get_user() -> Result<UserProfile, String> {
    STATE.with(|state| {
        let caller = caller();
        let user = state.borrow().user_data.get(&caller);
        if let Some(user) = user {
            Ok(user)
        } else {
            Err("User not found".to_string())
        }  
    })
}

#[ic_cdk::query]
pub fn get_user_by_id(id: Principal) -> Result<UserProfile, String> {
    STATE.with(|state| {
        let user = state.borrow().user_data.get(&id);
        if let Some(user) = user {
            Ok(user)
        } else {
            Err("User not found".to_string())
        }
    })
}

#[ic_cdk::query]
pub fn get_user_list() -> Result<Vec<UserProfile>, String> {
    STATE.with(|state| {
        Ok(state.borrow().user_data.values().map(|v| v.clone()).collect::<Vec<_>>())
    })
}