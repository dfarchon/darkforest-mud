import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from "./Frontend/Pages/LandingPage";
import { SandboxPage } from "./Frontend/Pages/SandboxPage";
import { ClassicLandingPage } from "./Frontend/Pages/ClassicLandingPage";
import "./index.css";
import "./Frontend/Styles/font/stylesheet.css";
import "./Frontend/Styles/icomoon/style.css";
import "./Frontend/Styles/preflight.css";
import "./Frontend/Styles/Press_Start_2P/stylesheet.css";
import "./Frontend/Styles/style.css";

export const App = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/landing" element={<ClassicLandingPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Router>
    </>
  );
};
