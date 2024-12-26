use candid::{CandidType, Principal, Nat};
use serde::{Deserialize, Serialize};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc::generic_value::Value;

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

#[derive(CandidType)]
pub struct FeatureFlags {
    pub icrc2: bool,
}

#[derive(CandidType)]
pub struct ArchiveOptions {
    pub num_blocks_to_archive: Nat,
    pub trigger_threshold: Nat,
    pub controller_id: Principal,
    pub cycles_for_archive_creation: Option<Nat>,
}

#[derive(CandidType)]
pub struct InitArgs {
    pub token_symbol: String,
    pub token_name: String,
    pub minting_account: Account,
    pub transfer_fee: Nat,
    pub metadata: Vec<(String, Value)>,
    pub initial_balances: Vec<(Account, Nat)>,
    pub archive_options: ArchiveOptions,
    pub feature_flags: Option<FeatureFlags>,
}

