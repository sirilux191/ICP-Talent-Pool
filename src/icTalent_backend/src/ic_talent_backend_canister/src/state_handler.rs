use candid::{Decode, Encode, Principal};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, Storable, StableBTreeMap};
use std::borrow::Cow;
use std::cell::RefCell;

use crate::types::{*};

// Define Memory Types  
pub type Memory = VirtualMemory<DefaultMemoryImpl>;
pub type UserDataMap = StableBTreeMap<Principal, UserProfile, Memory>;
pub type TokenDataMap = StableBTreeMap<String, TokenMetadata, Memory>;


const USER_DATA_MEMORY_ID: MemoryId = MemoryId::new(0);
const TOKEN_DATA_MEMORY_ID: MemoryId = MemoryId::new(1);


// Thread-local memory manager
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    pub static STATE: RefCell<State> = RefCell::new(
        MEMORY_MANAGER.with(|mm| State {
            user_data: UserDataMap::init(mm.borrow().get(USER_DATA_MEMORY_ID)),
            token_data: TokenDataMap::init(mm.borrow().get(TOKEN_DATA_MEMORY_ID)),
        })
    );
}   

// State to manage all maps
pub struct State {
    pub user_data: UserDataMap,
    pub token_data: TokenDataMap,
}

// State Initialization
#[ic_cdk::init]
fn init() {
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        state.user_data = init_user_data_map();
        state.token_data = init_token_data_map();
    });
}


// Initialize each map
pub fn init_user_data_map() -> UserDataMap {
    UserDataMap::init(get_user_data_memory())
}

pub fn init_token_data_map() -> TokenDataMap {
    TokenDataMap::init(get_token_data_memory())
}

// Memory accessors
pub fn get_user_data_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(USER_DATA_MEMORY_ID))
}

pub fn get_token_data_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(TOKEN_DATA_MEMORY_ID))
}


// Implement Storable for UserProfile
impl Storable for UserProfile {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
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
