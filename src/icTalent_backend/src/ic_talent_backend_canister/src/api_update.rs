use crate::state_handler::STATE;
use crate::types::UserProfile;
// use ic_cdk::{api::call::CallResult, call, caller, update};

#[ic_cdk::update]
pub fn create_user(user_profile: UserProfile) -> Result<String, String> {
    let caller = ic_cdk::caller();
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        if state.user_data.contains_key(&caller) {
            Err("User already exists".to_string())
        } else {
            let new_user = UserProfile {
                id: caller,
                name: user_profile.name,
                skill: user_profile.skill,
                description: user_profile.description,
                achievements: user_profile.achievements,
                stats: user_profile.stats,
            };
            state.user_data.insert(caller, new_user);
            Ok("User created!".to_string())
        }
    })
}


#[ic_cdk::update]
pub fn update_user(user_profile: UserProfile) -> Result<String, String> {
    let caller = ic_cdk::caller();
    STATE.with(|state| {
        let updated_user = UserProfile {
            id: caller,
            name: user_profile.name,
            skill: user_profile.skill,
            description: user_profile.description,
            achievements: user_profile.achievements,
            stats: user_profile.stats,
        };
        let mut state = state.borrow_mut();
        if state.user_data.contains_key(&caller) {
            state.user_data.insert(caller, updated_user);
            Ok("User updated!".to_string())
        } else {
            Err("User does not exist".to_string())
        }
    })
}
