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
            <Route path="/" element={<HelloPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </Theme>
    </>
   );
};


// import { useMUD } from "./MUDContext";
// import { CreatePlanetForm } from "./CreatePlanetFormTest";
// import { CreateMoveForm } from "./CreateMoveFormTest";
// import { PlayPauseButton } from "./PlayPauseButton";
// export const App = () => {
//   // Function to handle planet creation
//   const handleCreatePlanet = (
//     planetHash: string,
//     owner: string,
//     perlin: number,
//     level: number,
//     planetType: string,
//     spaceType: string,
//     population: number,
//     silver: number
//   ) => {
//     console.log("Planet Created:", {
//       planetHash,
//       owner,
//       perlin,
//       level,
//       planetType,
//       spaceType,
//       population,
//       silver,
//     });

//     // Here you can call the df__createPlanet function (smart contract interaction) using MUD's system call
//     // df__createPlanet(planetHash, owner, perlin, level, planetType, spaceType, population, silver);
//   };

//   const handleMoveSubmit = async (
//     proof: string,
//     moveInput: string,
//     population: number,
//     silver: number,
//     artifact: number
//   ) => {
//     console.log("Move sent:", {
//       proof,
//       moveInput,
//       population,
//       silver,
//       artifact,
//     });
//   };

//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-4">Create a Planet</h1>
//       <CreatePlanetForm onSubmit={handleCreatePlanet} />

//       <CreateMoveForm onSubmit={handleMoveSubmit} />
//       <PlayPauseButton />
//     </div>
//   );
// };
