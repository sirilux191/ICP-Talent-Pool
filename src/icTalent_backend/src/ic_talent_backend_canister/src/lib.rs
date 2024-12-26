mod api_update; 
mod api_query;
mod state_handler;
mod types;
use crate::types::*;
use candid::Principal;
// At the end of your lib.rs file
ic_cdk::export_candid!();
