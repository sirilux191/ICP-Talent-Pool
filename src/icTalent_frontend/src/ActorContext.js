import React from "react";

const ActorContext = React.createContext({
  actors: {
    icTalentBackend: null,
    tokenFactory: null,
    icrc_talent_token_ledger_canister: null,
  },
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export default ActorContext;
