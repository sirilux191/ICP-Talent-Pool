use ic_cdk::api::management_canister::main::{
    CreateCanisterArgument, CanisterIdRecord, CanisterSettings, CanisterInstallMode, InstallCodeArgument,
};
// #[ic_cdk::update]
// pub async fn create_talent_token(args: CreateTokenArgs) -> Result<Principal, Error> {
//     let caller = ic_cdk::caller();
    
//     WASM_MODULE.with(|wasm| {
//         if wasm.borrow().is_empty() {
//             return Err(Error::WasmNotSet);
//         }
//         Ok(())
//     })?;

//     let settings = CanisterSettings {
//         controllers: Some(vec![ic_cdk::id(), caller]),
//         compute_allocation: Some(Nat::from(0_u64)),
//         memory_allocation: Some(Nat::from(0_u64)),
//         freezing_threshold: Some(Nat::from(0_u64)),
//         log_visibility: None,
//         reserved_cycles_limit: None,
//         wasm_memory_limit: None,
//     };

//     let create_args = CreateCanisterArgument {
//         settings: Some(settings)
//     };

//     let (canister_id,): (CanisterIdRecord,) = ic_cdk::api::call::call(
//         Principal::management_canister(),
//         "create_canister",
//         (create_args,)
//     ).await.map_err(|e| Error::CreationFailed(e.1))?;

//     let wasm_module = WASM_MODULE.with(|w| w.borrow().clone());
//     let install_args = encode_args((args.clone(),)).unwrap();

//     let install_config = InstallCodeArgument {
//         mode: CanisterInstallMode::Install,
//         canister_id: canister_id.canister_id,
//         wasm_module,
//         arg: install_args
//     };

//     let _: () = ic_cdk::api::call::call(
//         Principal::management_canister(),
//         "install_code",
//         (install_config,)
//     ).await.map_err(|e| Error::CreationFailed(e.1))?;

//     let metadata = TokenMetadata {
//         name: args.name,
//         symbol: args.symbol,
//         decimals: args.decimals,
//         total_supply: args.total_supply,
//         owner: caller,
//         logo: args.logo,
//         created: ic_cdk::api::time(),
//     };

//     STATE.with(|state| {
//         state.borrow_mut().tokens.insert(canister_id.canister_id, metadata);
//     });

//     Ok(canister_id.canister_id)
// }

// #[ic_cdk::update]
// pub fn set_wasm_module(module: Vec<u8>) -> Result<(), Error> {
//     let caller = ic_cdk::caller();
//     STATE.with(|state| {
//         if caller != state.borrow().owner {
//             return Err(Error::NotAuthorized);
//         }
//         Ok(())
//     })?;

//     WASM_MODULE.with(|wasm| {
//         *wasm.borrow_mut() = module;
//     });

//     Ok(())
// }
