// index.tsx
import { useEffect } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";

import mudConfig from "contracts/mud.config";
import { useAccount } from "wagmi";

import { MUDProvider } from "./MUDContext";
import { Providers } from "./Providers";

// Ensure you import this
import "./index.css";

import { setup } from "./mud/setup";
import { GamePage } from "./pages/GamePage";
import { WelcomePage } from "./pages/WelcomePage";

// Ensure React root element is available
const rootElement = document.getElementById("react-root");
if (!rootElement) throw new Error("React root not found");
const root = ReactDOM.createRoot(rootElement);

const ProtectedRoutes = () => {
  const { isConnected } = useAccount(); // Get wallet connection status
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      // Redirect to the root page (App) if the wallet is not connected
      navigate("/");
    }
  }, [isConnected, navigate]);

  return (
    <Routes>
      {/* Root "/" page */}
      <Route path="/" element={<WelcomePage />} />
      {/* Game page, only accessible if wallet is connected */}
      {isConnected && <Route path="/game" element={<GamePage />} />}
    </Routes>
  );
};

// Initialize setup for MUD (contracts, providers, network, etc.)
setup().then(async (result) => {
  // Render the application with MUDProvider and Providers
  root.render(
    <React.StrictMode>
      <MUDProvider value={result}>
        <Providers>
          <BrowserRouter>
            <ProtectedRoutes />
          </BrowserRouter>{" "}
        </Providers>{" "}
      </MUDProvider>
    </React.StrictMode>,
  );

  if (import.meta.env.DEV) {
    const { mount: mountDevTools } = await import("@latticexyz/dev-tools");
    mountDevTools({
      config: mudConfig,
      publicClient: result.network.publicClient,
      walletClient: result.network.walletClient,
      latestBlock$: result.network.latestBlock$,
      storedBlockLogs$: result.network.storedBlockLogs$,
      worldAddress: result.network.worldContract.address,
      worldAbi: result.network.worldContract.abi,
      write$: result.network.write$,
      recsWorld: result.network.world,
    });
  }
});
