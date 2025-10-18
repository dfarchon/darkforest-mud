import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";

// (no core UI imports needed for basic structure)
import dfstyles from "../Styles/dfstyles";

export const enum LandingPageZIndex {
  Background = 0,
  Canvas = 1,
  BasePage = 2,
}

export function DarkForestPunkLandingPage() {
  return (
    <Page>
      <AnimatedBackground />
      <TitleContainer>
        <MainTitle>Dark Forest Punk</MainTitle>
      </TitleContainer>
      <LandingCenterButton />
      <PillChoice />

      <BottomTitle>Choose Your Onchain Reality</BottomTitle>
    </Page>
  );
}

function LandingCenterButton() {
  const handleTwitterClick = () => {
    window.open(
      "https://twitter.com/intent/follow?screen_name=darkforest_punk",
      "_blank",
    );
  };

  return (
    <CenterContainer>
      <ImgContainer>
        <LandingButtonImg src={"/favicon.ico"} onClick={handleTwitterClick} />
      </ImgContainer>
    </CenterContainer>
  );
}

// Pill Choice Component
function PillChoice() {
  const navigate = useNavigate();

  return (
    <PillContainer>
      <PillButtonWrapper side="left">
        <MatrixHand color="red" />
        <PillButton color="red" onClick={() => navigate("/redpill")}>
          <PillGlow color="red" />
          <PillContent>
            <PillText>Red Pill</PillText>
            <PillSubtext>classic terminal login</PillSubtext>
          </PillContent>
        </PillButton>
      </PillButtonWrapper>

      <PillButtonWrapper side="right">
        <MatrixHand color="blue" />
        <PillButton color="blue" onClick={() => navigate("/bluepill")}>
          <PillGlow color="blue" />
          <PillContent>
            <PillText>Blue Pill</PillText>
            <PillSubtext>Login with MetaMask / Wallet</PillSubtext>
          </PillContent>
        </PillButton>
      </PillButtonWrapper>
    </PillContainer>
  );
}

const CenterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const ImgContainer = styled.div`
  display: inline-block;
  text-align: right;
  width: 100px;
  max-width: 60vw;
  /* transparent to let the animated background shine through */
  img:hover {
    transform: scale(1.8);
  }
  @media only screen and (max-device-width: 1000px) {
    width: 80%;
    max-width: 80%;
    padding: 8px;
    font-size: 80%;
  }
`;

const LandingButtonImg = styled.img`
  cursor: pointer;
  transition: all 0.3s;
`;

// Animated sacred glow with expanding rings and bio-organic blobs
const pulse = keyframes`
  0% { transform: translate(-50%, -50%) scale(0.78); opacity: 0.9; filter: blur(0.8px); }
  60% { transform: translate(-50%, -50%) scale(1.28); opacity: 0.3; filter: blur(1.9px); }
  100% { transform: translate(-50%, -50%) scale(1.48); opacity: 0; filter: blur(2.6px); }
`;

const wobble = keyframes`
  0% { transform: translate(-50%, -50%) rotate(0deg) scale(1, 1); }
  50% { transform: translate(-50%, -50%) rotate(6deg) scale(1.06, 0.96); }
  100% { transform: translate(-50%, -50%) rotate(0deg) scale(1, 1); }
`;

const breath = keyframes`
  0% { opacity: 0.15 }
  50% { opacity: 0.35 }
  100% { opacity: 0.15 }
`;

const Field = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${LandingPageZIndex.Background};
  overflow: hidden;
  pointer-events: none;
  background: radial-gradient(
      20% 20% at 50% 30%,
      rgba(255, 218, 226, 0.04),
      transparent 60%
    ),
    radial-gradient(
      15% 15% at 30% 20%,
      rgba(255, 195, 205, 0.04),
      transparent 60%
    ),
    radial-gradient(
      18% 18% at 70% 40%,
      rgba(255, 122, 168, 0.03),
      transparent 60%
    ),
    linear-gradient(180deg, #0a0a0c 0%, #0b0b10 100%);
`;

const Rings = styled.div`
  position: absolute;
  left: 50%;
  top: 30%;
  width: 40vmin;
  height: 40vmin;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 0 10px rgba(255, 185, 205, 0.1));
`;

const Ring = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16vmin;
  height: 16vmin;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(255, 244, 249, 0.5) 0%,
    rgba(255, 208, 218, 0.22) 36%,
    rgba(255, 136, 178, 0.06) 60%,
    rgba(255, 136, 178, 0) 66%
  );
  mix-blend-mode: screen;
  animation: ${pulse} linear infinite;
`;

const Halo = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10vmin;
  height: 10vmin;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    rgba(255, 247, 250, 0.25) 0%,
    rgba(255, 218, 226, 0.15) 44%,
    rgba(255, 195, 205, 0.08) 64%,
    rgba(255, 122, 168, 0.04) 78%,
    rgba(255, 122, 168, 0) 86%
  );
  box-shadow: 0 0 25px 8px rgba(255, 195, 205, 0.06) inset;
  mix-blend-mode: screen;
  animation: ${breath} 6s ease-in-out infinite;
`;

const Blob = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12vmin;
  height: 12vmin;
  transform: translate(-50%, -50%);
  border-radius: 55% 45% 60% 40% / 55% 55% 45% 45%;
  background: radial-gradient(
      60% 60% at 40% 40%,
      rgba(255, 218, 226, 0.2),
      transparent 70%
    ),
    radial-gradient(
      40% 40% at 65% 60%,
      rgba(255, 195, 205, 0.15),
      transparent 70%
    ),
    radial-gradient(
      100% 100% at 50% 50%,
      rgba(255, 122, 168, 0.04),
      rgba(255, 122, 168, 0.02)
    );
  filter: blur(4px) contrast(105%);
  mix-blend-mode: screen;
  animation: ${wobble} 10s ease-in-out infinite;
`;

function AnimatedBackground() {
  const ringConfigs = [
    { delay: 0.0, duration: 3.4, size: "36vmin" },
    { delay: 0.4, duration: 3.8, size: "40vmin" },
    { delay: 0.8, duration: 4.2, size: "44vmin" },
    { delay: 1.2, duration: 4.6, size: "48vmin" },
    { delay: 1.6, duration: 5.0, size: "52vmin" },
    { delay: 2.0, duration: 5.4, size: "56vmin" },
    { delay: 2.4, duration: 5.8, size: "60vmin" },
    { delay: 2.8, duration: 6.2, size: "64vmin" },
  ];

  return (
    <Field>
      <Rings>
        <Halo />
        <Blob />
        {ringConfigs.map((r, i) => (
          <Ring
            key={i}
            style={{
              width: r.size,
              height: r.size,
              animationDuration: `${r.duration}s`,
              animationDelay: `${r.delay}s`,
            }}
          />
        ))}
      </Rings>
    </Field>
  );
}

// Pill Choice Styles
const pillGlow = keyframes`
  0% { box-shadow: 0 0 20px currentColor; }
  50% { box-shadow: 0 0 40px currentColor, 0 0 60px currentColor; }
  100% { box-shadow: 0 0 20px currentColor; }
`;

const PillContainer = styled.div`
  position: absolute;
  bottom: 25%;
  left: 0;
  right: 0;
  z-index: ${LandingPageZIndex.BasePage};
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24rem; /* Increased from 12rem */
  padding: 0 5%;
`;

const PillButtonWrapper = styled.div<{ side: "left" | "right" }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MatrixHand = styled.div<{ color: "red" | "blue" }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  z-index: -1;
  opacity: 0.6;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 150px;
    background: ${(props) =>
      props.color === "red"
        ? "linear-gradient(45deg, rgba(255, 0, 0, 0.7), rgba(255, 100, 100, 0.5))"
        : "linear-gradient(45deg, rgba(0, 0, 255, 0.7), rgba(100, 100, 255, 0.5))"};
    border-radius: 50px 50px 50px 20px;
    box-shadow:
      0 0 30px
        ${(props) =>
          props.color === "red"
            ? "rgba(255, 0, 0, 0.6)"
            : "rgba(0, 0, 255, 0.6)"},
      inset 0 0 25px rgba(255, 255, 255, 0.2);
    animation: ${wobble} 6s ease-in-out infinite;
  }
`;

const PillButton = styled.button<{ color: "red" | "blue" }>`
  position: relative;
  width: 220px; /* Increased from 180px */
  height: 220px; /* Increased from 180px */
  border-radius: 50%;
  border: 3px solid
    ${(props) => (props.color === "red" ? "#ff4444" : "#4444ff")};
  background: ${(props) =>
    props.color === "red"
      ? "radial-gradient(circle, #ff6666 0%, #cc0000 100%)"
      : "radial-gradient(circle, #6666ff 0%, #0000cc 100%)"};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
  font-family: "Courier New", monospace;
  box-shadow:
    0 0 40px
      ${(props) =>
        props.color === "red"
          ? "rgba(255, 68, 68, 0.6)"
          : "rgba(68, 68, 255, 0.6)"},
    inset 0 0 30px rgba(255, 255, 255, 0.1);
  overflow: hidden;
  z-index: 1;

  &:hover {
    transform: scale(1.1) translateY(-10px);
    box-shadow:
      0 20px 60px
        ${(props) =>
          props.color === "red"
            ? "rgba(255, 68, 68, 0.8)"
            : "rgba(68, 68, 255, 0.8)"},
      inset 0 0 40px rgba(255, 255, 255, 0.2);
    border-color: ${(props) => (props.color === "red" ? "#ffaaaa" : "#aaaaff")};
  }

  &:active {
    transform: scale(0.95) translateY(-5px);
  }
`;

const PillGlow = styled.div<{ color: "red" | "blue" }>`
  position: absolute;
  top: -15px; /* Adjusted for larger pill */
  left: -15px; /* Adjusted for larger pill */
  right: -15px; /* Adjusted for larger pill */
  bottom: -15px; /* Adjusted for larger pill */
  border-radius: 50%;
  background: ${(props) =>
    props.color === "red"
      ? "radial-gradient(circle, rgba(255, 100, 100, 0.4) 0%, transparent 70%)"
      : "radial-gradient(circle, rgba(100, 100, 255, 0.4) 0%, transparent 70%)"};
  animation: ${pillGlow} 3s ease-in-out infinite;
  z-index: -1;
`;

const PillContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

const PillText = styled.div`
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 0.4rem;
  text-shadow: 0 0 12px currentColor;
  letter-spacing: 0.1em;
`;

const PillSubtext = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
  font-style: italic;
  text-shadow: 0 0 8px currentColor;
  text-align: center;
  line-height: 1.2;
`;

// Title Styles
const titleGlow = keyframes`
  0% { text-shadow: 0 0 10px ${dfstyles.colors.dfpink}, 0 0 20px ${dfstyles.colors.dfpink}, 0 0 30px ${dfstyles.colors.dfpink}; }
  50% { text-shadow: 0 0 20px ${dfstyles.colors.dfpink}, 0 0 40px ${dfstyles.colors.dfpink}, 0 0 60px ${dfstyles.colors.dfpink}; }
  100% { text-shadow: 0 0 10px ${dfstyles.colors.dfpink}, 0 0 20px ${dfstyles.colors.dfpink}, 0 0 30px ${dfstyles.colors.dfpink}; }
`;

const TitleContainer = styled.div`
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  z-index: ${LandingPageZIndex.BasePage};
  text-align: center;
`;

const MainTitle = styled.h1`
  font-family: "Courier New", monospace;
  font-size: 3rem;
  color: ${dfstyles.colors.dfpink};
  margin: 0;
  animation: ${titleGlow} 3s ease-in-out infinite;
  letter-spacing: 0.3em;
  font-weight: bold;

  @media only screen and (max-device-width: 1000px) {
    font-size: 2rem;
    letter-spacing: 0.2em;
  }
`;

const BottomTitle = styled.h1`
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  font-family: "Courier New", monospace;
  font-size: 2rem;
  color: ${dfstyles.colors.dfpink};
  margin: 0;
  text-shadow:
    0 0 10px ${dfstyles.colors.dfpink},
    0 0 20px ${dfstyles.colors.dfpink},
    0 0 30px ${dfstyles.colors.dfpink};
  letter-spacing: 0.3em;
  animation: ${titleGlow} 3s ease-in-out infinite;
  font-weight: bold;
  z-index: ${LandingPageZIndex.BasePage};
  white-space: nowrap;

  @media only screen and (max-device-width: 1000px) {
    font-size: 2rem;
    letter-spacing: 0.2em;
  }
`;

const Page = styled.div`
  position: absolute;
  width: 100vw;
  max-width: 100vw;
  height: 100%;
  color: white;
  background-color: #0a0a0c;
  font-size: ${dfstyles.fontSize};
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: ${LandingPageZIndex.BasePage};
  /* no static background image */
`;
