import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from "./Frontend/Pages/LandingPage";
import { SandboxPage } from "./Frontend/Pages/SandboxPage";

export const App = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Router>
    </>
  );
};
