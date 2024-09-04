import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { createGlobalStyle } from "styled-components";

import { Theme } from "./Frontend/Components/Theme";
import { GameLandingPage } from "./Frontend/Pages/GameLandingPage";
import { HelloPage } from "./Frontend/Pages/HelloPage";
import { ClassicLandingPage } from "./Frontend/Pages/LandingPage";
import { NotFoundPage } from "./Frontend/Pages/NotFoundPage";
import { SandboxPage } from "./Frontend/Pages/SandboxPage";
import "./Frontend/Styles/Press_Start_2P/stylesheet.css";
import dfstyles from "./Frontend/Styles/dfstyles";
import "./Frontend/Styles/font/stylesheet.css";
import "./Frontend/Styles/icomoon/style.css";
import "./Frontend/Styles/preflight.css";
import "./Frontend/Styles/style.css";
import "./index.css";
import { getNetworkConfig } from "./mud/getNetworkConfig";
import { useAccount } from "wagmi";
// TODO handle the pages folder
import { GamePage } from "./pages/GamePage";
import { WelcomePage } from "./pages/WelcomePage";

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
  const { isConnected } = useAccount(); // Get wallet connection status

  return (
    <>
      <GlobalStyle />
      <Theme color="dark" scale="medium">
        <Router>
          <Routes>
            <Route path="/play" element={<Navigate to={`/play/${defaultAddress}`} replace={true} />} />
            <Route path="/play/:contract" element={<GameLandingPage />} />
            <Route path="/landing" element={<ClassicLandingPage />} />
            <Route path="/sandbox" element={<SandboxPage />} />
            <Route path="/hello" element={<HelloPage />} />
            <Route path="/welcome" element={<WelcomePage />} />
            {isConnected && <Route path="/game" element={<GamePage />} />}

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </Theme>
    </>
  );
};
