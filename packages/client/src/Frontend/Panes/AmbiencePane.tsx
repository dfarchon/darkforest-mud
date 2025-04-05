import React, { useEffect, useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import ReactHowler from "react-howler";
import { Slider } from "../Components/Slider";
import dfstyles from "../Styles/dfstyles";
import { DFZIndex } from "../Utils/constants";
import {
  useBooleanSetting,
  useNumberSetting,
} from "@frontend/Utils/SettingsHooks";
import { useUIManager } from "@frontend/Utils/AppHooks";
import { Setting } from "@df/types";
import { DarkForestSliderHandle } from "@df/ui";

const StyledAmbiencePane = styled.div`
  z-index: ${DFZIndex.MenuBar};
  padding-left: 0.75em;
  margin-top: 0.25em;
  display: flex;
  font-size: 1.5em;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  height: 32px;
  width: 100%;
  & > a:first-child {
    margin-right: 0.75em;
    height: 100%;
    display: flex;
    align-items: center;
  }
  color: ${dfstyles.colors.subtext};
  & > a {
    &:hover {
      color: ${dfstyles.colors.text};
      cursor: pointer;
    }
    &:active {
      color: ${dfstyles.colors.subbertext};
    }
  }
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const scale = keyframes`
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(0.8);
  }
  100% {
    transform: scale(1);
  }
`;

const IconMusicNote = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  min-width: 1rem;
  min-height: 1rem;
  margin-top: -4px;
  &::before {
    content: "\\266A";
  }
`;

const IconLoading = styled(IconMusicNote)`
  &::after {
    content: "\\21BB";
    position: absolute;
    font-size: 1rem;
    left: 0.6rem;
    top: 0.6rem;
    animation: ${spin} 2s linear infinite;
  }
`;

const IconPlaying = styled(IconMusicNote)`
  &::after {
    content: "\\25B6";
    position: absolute;
    font-size: 1rem;
    left: 0.6rem;
    top: 0.6rem;
    animation: ${scale} 1s ease-in-out infinite;
  }
`;

const IconMuted = styled(IconMusicNote)`
  &::after {
    content: "\\23F8";
    position: absolute;
    font-size: 1rem;
    left: 0.6rem;
    top: 0.6rem;
  }
`;

const StyledSlider = styled(Slider)`
  margin-top: 2px;
`;

export function AmbiencePane() {
  const uiManager = useUIManager();

  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useBooleanSetting(
    uiManager,
    Setting.BackgroundMusicEnabled,
  );

  const [backgroundMusicVolume, setBackgroundMusicVolume] = useNumberSetting(
    uiManager,
    Setting.BackgroundMusicVolume,
  );

  const [loaded, setLoaded] = useState<boolean>(false);
  const [mainMelodyLoaded, setMainMelodyLoaded] = useState<boolean>(false);
  const [universeLoaded, setUniverseLoaded] = useState<boolean>(false);

  const [hovering, setHovering] = useState<boolean>(false);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState<boolean>(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("--------------------");
    console.log("mainMelodyLoaded", mainMelodyLoaded);
    console.log("universeLoaded", universeLoaded);
    console.log("backgroundMusicEnabled", backgroundMusicEnabled);
    console.log("isActuallyPlaying", isActuallyPlaying);
  }, [
    mainMelodyLoaded,
    universeLoaded,
    backgroundMusicEnabled,
    isActuallyPlaying,
  ]);

  useEffect(() => {
    if (mainMelodyLoaded && universeLoaded) {
      setLoaded(true);
      if (backgroundMusicEnabled) {
        setIsActuallyPlaying(true);
      } else {
        setIsActuallyPlaying(false);
      }
    }
  }, [mainMelodyLoaded, universeLoaded, backgroundMusicEnabled]);

  const handleOnEnd = () => {
    setIsActuallyPlaying(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (backgroundMusicEnabled) {
        setIsActuallyPlaying(true);
      }
    }, 30000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const onScrollVolumeChange = (
    e: Event & React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseFloat(e.target.value);

    if (!isNaN(value)) {
      setBackgroundMusicVolume(value);
    }
  };

  return (
    <StyledAmbiencePane
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {loaded ? (
        <a onClick={() => setBackgroundMusicEnabled(!backgroundMusicEnabled)}>
          {backgroundMusicEnabled ? <IconPlaying /> : <IconMuted />}
        </a>
      ) : (
        <IconLoading />
      )}
      {hovering && (
        <StyledSlider
          hideStepper
          labelVisibility="none"
          value={backgroundMusicVolume}
          min={0}
          max={10}
          step={1}
          onChange={onScrollVolumeChange}
        />
      )}
      <ReactHowler
        src="/public/sounds/bgm-v3.ogg"
        playing={isActuallyPlaying}
        loop={false}
        html5={true}
        volume={0.1 * Number(backgroundMusicVolume)}
        onLoad={() => setMainMelodyLoaded(true)}
        onEnd={handleOnEnd}
      />
      <ReactHowler
        src="/public/sounds/universe.ogg"
        playing={backgroundMusicEnabled}
        loop={true}
        html5={true}
        volume={0.1 * Number(backgroundMusicVolume)}
        onLoad={() => setUniverseLoaded(true)}
      />
    </StyledAmbiencePane>
  );
}
