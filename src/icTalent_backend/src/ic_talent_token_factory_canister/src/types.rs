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
    pub total_token_given: u64,
    pub status: String,
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

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct FeatureFlags {
    pub icrc2: bool,
}

#[derive(CandidType)]
pub struct InitArgs {
    pub minting_account: Account,
    pub fee_collector_account: Option<Account>,
    pub initial_balances: Vec<(Account, Nat)>,
    pub transfer_fee: Nat,
    pub decimals: Option<u8>,
    pub token_name: String,
    pub token_symbol: String,
    pub metadata: Vec<(String, Value)>,
    pub archive_options: ArchiveOptions,
    pub max_memo_length: Option<u16>,
    pub feature_flags: Option<FeatureFlags>,
    pub maximum_number_of_accounts: Option<u64>,
    pub accounts_overflow_trim_quantity: Option<u64>,
}

#[derive(Serialize, Deserialize, CandidType, Clone, Debug, PartialEq, Eq)]
pub struct ArchiveOptions {
    /// The number of blocks which, when exceeded, will trigger an archiving
    /// operation.
    pub trigger_threshold: usize,
    /// The number of blocks to archive when trigger threshold is exceeded.
    pub num_blocks_to_archive: usize,
    pub node_max_memory_size_bytes: Option<u64>,
    pub max_message_size_bytes: Option<u64>,
    pub controller_id: Principal,
    // More principals to add as controller of the archive.
    #[serde(default)]
    pub more_controller_ids: Option<Vec<Principal>>,
    // cycles to use for the call to create a new archive canister.
    #[serde(default)]
    pub cycles_for_archive_creation: Option<u64>,
    // Max transactions returned by the [get_transactions] endpoint.
    #[serde(default)]
    pub max_transactions_per_response: Option<u64>,
}