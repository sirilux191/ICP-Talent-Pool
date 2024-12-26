use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct TokenMetadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u64,
    pub owner: Principal,
    pub logo: Option<String>,
    pub created: u64,
}

#[derive(CandidType,Serialize, Deserialize, Clone)]
pub struct FaucetTokenRequest{
    pub current_token_request: u32,
    pub total_number_of_request: u32,
    pub total_token_given: u64
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct CreateTokenArgs {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: u64,
    pub logo: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub enum Error {
    NotAuthorized,
    RequestNotFound,
    TransferFailed(String),
    // ... other variants ...
}


