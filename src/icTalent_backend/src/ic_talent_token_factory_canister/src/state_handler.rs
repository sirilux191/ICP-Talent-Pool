use candid::{Decode, Encode, Principal};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, Storable, StableBTreeMap};
use std::borrow::Cow;
use std::cell::RefCell;

use crate::types::*;

// Define Memory Types
pub type Memory = VirtualMemory<DefaultMemoryImpl>;
pub type TokenMap = StableBTreeMap<Principal, TokenMetadata, Memory>;
pub type FaucetRequestMap = StableBTreeMap<Principal, FaucetTokenRequest, Memory>;
pub type TalentTokenMap = StableBTreeMap<Principal, Principal, Memory>;

// Memory IDs for Maps
const TOKEN_MAP_MEMORY_ID: MemoryId = MemoryId::new(0);
const FAUCET_REQUEST_MAP_MEMORY_ID: MemoryId = MemoryId::new(1);
const TALENT_TOKEN_MAP_MEMORY_ID: MemoryId = MemoryId::new(2);



// Thread-local memory manager
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    pub static WASM_MODULE: RefCell<Vec<u8>> = RefCell::new(Vec::new());

    pub static STATE: RefCell<State> = RefCell::new(
        MEMORY_MANAGER.with(|mm| State {
            tokens: TokenMap::init(mm.borrow().get(TOKEN_MAP_MEMORY_ID)),
            faucet_requests: FaucetRequestMap::init(mm.borrow().get(FAUCET_REQUEST_MAP_MEMORY_ID)),
            talent_token_map: TalentTokenMap::init(mm.borrow().get(TALENT_TOKEN_MAP_MEMORY_ID)),
            admin: ic_cdk::api::id(),
            token_canister_id: Principal::anonymous(),
            is_admin_registered: false,
        })
    );
}

// State to manage all maps and variables
pub struct State {
    pub tokens: TokenMap,
    pub faucet_requests: FaucetRequestMap,
    pub talent_token_map: TalentTokenMap,
    pub admin: Principal,
    pub token_canister_id: Principal,
    pub is_admin_registered: bool,
}

// State Initialization
#[ic_cdk::init]
fn init(token_canister_id: Principal) {
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        state.admin = Principal::from_text("aaaaa-aa").unwrap();
        state.token_canister_id = token_canister_id;
        state.is_admin_registered = false;
        state.tokens = init_token_map();
        state.faucet_requests = init_faucet_request_map();
        state.talent_token_map = init_talent_token_map();
    });
}

// Initialize each map
pub fn init_token_map() -> TokenMap {
    TokenMap::init(get_token_map_memory())
}

pub fn init_faucet_request_map() -> FaucetRequestMap {
    FaucetRequestMap::init(get_faucet_request_map_memory())
}

pub fn init_talent_token_map() -> TalentTokenMap {
    TalentTokenMap::init(get_talent_token_map_memory())
}

// Memory accessors for Maps
pub fn get_token_map_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(TOKEN_MAP_MEMORY_ID))
}

pub fn get_faucet_request_map_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(FAUCET_REQUEST_MAP_MEMORY_ID))
}

pub fn get_talent_token_map_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(TALENT_TOKEN_MAP_MEMORY_ID))
}


// Implement Storable for TokenMetadata
impl Storable for TokenMetadata {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

// Implement Storable for FaucetTokenRequest
impl Storable for FaucetTokenRequest {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}