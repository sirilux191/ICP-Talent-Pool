import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import Header from "./components/Header";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import TalentProfile from "./pages/TalentProfile";
import ActorContext from "./ActorContext";
import { ToastContainer } from "react-toastify";
import Admin from "./pages/Admin";

import { createActor as createICTalentBackendActor } from "../../declarations/ic_talent_backend_canister";
import { createActor as createTokenFactoryActor } from "../../declarations/ic_talent_token_factory_canister";

function App() {
  const [actors, setActors] = useState({
    icTalentBackend: null,
    tokenFactory: null,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);

  useEffect(() => {
    initAuthClient();
  }, []);

  async function initAuthClient() {
    const client = await AuthClient.create();
    setAuthClient(client);
    if (await client.isAuthenticated()) {
      setIsAuthenticated(true);
      await initializeActors(client);
    }
  }

  async function initializeActors(client) {
    const identity = client.getIdentity();
    const agent = new HttpAgent({ identity });

    if (process.env.DFX_NETWORK !== "ic") {
      await agent.fetchRootKey().catch(console.error);
    }

    try {
      const backendActor = createICTalentBackendActor(
        process.env.CANISTER_ID_IC_TALENT_BACKEND_CANISTER,
        { agent }
      );
      const tokenFactoryActor = createTokenFactoryActor(
        process.env.CANISTER_ID_IC_TALENT_TOKEN_FACTORY_CANISTER,
        { agent }
      );

      setActors({
        icTalentBackend: backendActor,
        tokenFactory: tokenFactoryActor,
      });
    } catch (error) {
      console.error("Error initializing actors:", error);
    }
  }

  async function login() {
    if (authClient) {
      await new Promise((resolve) => {
        authClient.login({
          identityProvider: process.env.II_URL,
          onSuccess: resolve,
        });
      });
      setIsAuthenticated(true);
      await initializeActors(authClient);
    }
  }

  async function logout() {
    setActors({
      icTalentBackend: null,
      tokenFactory: null,
    });
    setIsAuthenticated(false);
    if (authClient) {
      await authClient.logout();
    }
  }

  return (
    <ActorContext.Provider value={{ actors, isAuthenticated, login, logout }}>
      <ThemeProvider
        defaultTheme="dark"
        storageKey="vite-ui-theme"
      >
        <ToastContainer />
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route
                  path="/"
                  element={<Home />}
                />
                <Route
                  path="/explore"
                  element={<Explore />}
                />
                <Route
                  path="/profile"
                  element={<Profile />}
                />
                <Route
                  path="/talent/:id"
                  element={<TalentProfile />}
                />
                <Route
                  path="/admin"
                  element={<Admin />}
                />
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </ActorContext.Provider>
  );
}

export default App;
