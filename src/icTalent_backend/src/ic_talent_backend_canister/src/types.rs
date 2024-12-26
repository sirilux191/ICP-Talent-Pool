use serde::{Deserialize, Serialize};
use candid::{CandidType, Principal};

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct UserProfile {
    pub id: Principal,
    pub name: String,
    pub skill: String,
    pub description: String,
    pub achievements: Vec<String>,
    pub stats: UserStats,
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct UserStats {
    pub years_experience: u8,
    pub projects_completed: u8,
    pub client_satisfaction: u8,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct TokenMetadata {
    pub token_name: String,
    pub token_symbol: String,
    pub total_supply: u64,
    pub circulating_supply: u64,
    pub token_price: u64,
    pub talent_id: Principal,
}