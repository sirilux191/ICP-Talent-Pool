import React from "react";

const ActorContext = React.createContext({
  actors: {
    icTalentBackend: null,
    tokenFactory: null,

  },
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export default ActorContext;
