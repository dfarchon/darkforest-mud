import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Theme } from "./Frontend/Components/Theme";
import { HelloPage } from "./Frontend/Pages/HelloPage";
import { SandboxPage } from "./Frontend/Pages/SandboxPage";
import { ClassicLandingPage } from "./Frontend/Pages/LandingPage";
import { NotFoundPage } from "./Frontend/Pages/NotFoundPage";
import { GameLandingPage } from "./Frontend/Pages/GameLandingPage";
import "./index.css";
import "./Frontend/Styles/font/stylesheet.css";
import "./Frontend/Styles/icomoon/style.css";
import "./Frontend/Styles/preflight.css";
import "./Frontend/Styles/Press_Start_2P/stylesheet.css";
import "./Frontend/Styles/style.css";
import { createGlobalStyle } from "styled-components";
import dfstyles from "./Frontend/Styles/dfstyles";
import { getNetworkConfig } from "./mud/getNetworkConfig";
import { WelcomePage } from "./Frontend/Pages/WelcomePage";
import { GamePage } from "./Frontend/Pages/GamePage";
import { PlanetTestPage } from "./PlanetTest/PlanetTestPage";
const GlobalStyle = createGlobalStyle`
body {
  width: 100vw;
  min-height: 100vh;
  background-color: ${dfstyles.colors.background};
}
`;

export const App = () => {
  const networkConfig = getNetworkConfig();
  const defaultAddress = networkConfig.worldAddress;

  return (
    <>
      <GlobalStyle />
      <Theme color="dark" scale="medium">
        <Router>
          <Routes>
            <Route
              path="/play"
              element={
                <Navigate to={`/play/${defaultAddress}`} replace={true} />
              }
            />
            <Route path="/play/:contract" element={<GameLandingPage />} />
            <Route path="/landing" element={<ClassicLandingPage />} />
            <Route path="/sandbox" element={<SandboxPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/test" element={<PlanetTestPage />} />
            <Route path="/" element={<HelloPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </Theme>
    </>
  );
};


