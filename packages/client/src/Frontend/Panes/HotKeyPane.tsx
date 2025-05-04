import { getPlanetRank } from "@df/gamelogic";
import type {
  Artifact,
  ArtifactId,
  Biome,
  LocatablePlanet,
  LocationId,
  Planet,
  WorldLocation,
} from "@df/types";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

import { ArtifactImage } from "../Components/ArtifactImage";
import { Btn, ShortcutBtn } from "../Components/Btn";
import { Spacer } from "../Components/CoreUI";
import { usePlanet, useUIManager } from "../Utils/AppHooks";

const mainLine = "1234567890".split("");

// same as above, except for silver
const shipLine = "!@#$%^&*()".split("");

interface Hotkey {
  location: LocationId | undefined;
  key: string;
  artifact?: Artifact;
}

export function HotkeyThumbArtShips({
  hotkey,
  selectedPlanetVisible,
}: {
  hotkey: Hotkey;
  selectedPlanetVisible: { selectedPlanetVisible: boolean };
}) {
  const uiManager = useUIManager();

  const click = useCallback(() => {
    if (hotkey.artifact && !selectedPlanetVisible.selectedPlanetVisible) {
      const selectedArtifact = hotkey.artifact as unknown as Artifact;
      const refreshArt: Artifact | undefined = ui.getArtifactWithId(
        selectedArtifact.id,
      );
      if (refreshArt?.onPlanetId === undefined) {
        console.log("Artifact / ship on move");
        return;
      }

      uiManager.centerLocationId(refreshArt.onPlanetId);
    } else {
      console.log("Deselect planet!!!");
    }
  }, [hotkey]);

  return (
    <HotkeyButton
      className="test"
      onClick={click}
      onShortcutPressed={click}
      shortcutKey={hotkey.key}
      shortcutText={hotkey.key}
      onMouseEnter={() => {
        uiManager?.setHoveringOverArtifact(hotkey?.artifact?.id);
      }}
      onMouseLeave={() => {
        uiManager?.setHoveringOverArtifact(undefined);
      }}
      disabled={selectedPlanetVisible.selectedPlanetVisible}
    >
      {hotkey.artifact ? (
        <div className="relative left-[2px]">
          <ArtifactImage artifact={hotkey.artifact} size={24} />
        </div>
      ) : (
        hotkey.key
      )}
    </HotkeyButton>
  );
}

export function HotkeysArtShipPane(selectedPlanetVisible: {
  selectedPlanetVisible: boolean;
}) {
  const uiManager = useUIManager();

  const [hotkeys, setHotkeys] = useState<Hotkey[]>([]);

  const getShipHotkeys = () => {
    return `${uiManager.getContractAddress()}-${uiManager.getAccount()?.toLowerCase()}-shipHotkeys`;
  };

  useEffect(() => {
    // Load hotkeys from localStorage or initialize them if not present
    const shipHotkeys = getShipHotkeys();
    const savedHotkeys = localStorage.getItem(shipHotkeys);
    if (savedHotkeys) {
      setHotkeys(JSON.parse(savedHotkeys));
    } else {
      initializeHotkeys();
    }
  }, []);

  const initializeHotkeys = () => {
    const newHotkeys = shipLine.map((key) => ({
      location: undefined,
      key,
    }));
    setHotkeys(newHotkeys);
    saveHotkeys(newHotkeys);
  };

  const saveHotkeys = (hotkeysToSave: Hotkey[]) => {
    const shipHotkeys = getShipHotkeys();
    localStorage.setItem(shipHotkeys, JSON.stringify(hotkeysToSave));
  };

  const handleSetArtifact = (index: number) => {
    const element: HTMLElement | null = document.querySelector(
      '.artifact-details-pane-body .artifact-id-container [class^="TextPreview__ShortenedText"',
    );
    if (element === null) {
      console.log("Artifact or ship not selected to be able set shortcut");
      return;
    }
    const selectedArtifact = element.innerText as unknown as ArtifactId;
    const art: Artifact | undefined = ui.getArtifactWithId(selectedArtifact);
    const updatedHotkeys = [...hotkeys];
    updatedHotkeys[index].location = art?.onPlanetId;
    updatedHotkeys[index].artifact = art;
    setHotkeys(updatedHotkeys);
    saveHotkeys(updatedHotkeys);
  };

  return (
    <StyledHotkeysArtShipsPane>
      {hotkeys.length > 0 &&
        hotkeys.map((h, i) => (
          <div key={i} style={{ display: "flex", marginInline: 0 }}>
            <HotkeyThumbArtShips
              hotkey={{ ...h, key: shipLine[i] }}
              selectedPlanetVisible={selectedPlanetVisible}
            />
            <Spacer width={1} />
            <SetKeyButtonArt onClick={() => handleSetArtifact(i)} />
          </div>
        ))}
    </StyledHotkeysArtShipsPane>
  );
}

export function HotkeysMainLinePane(selectedPlanetVisible: {
  selectedPlanetVisible: boolean;
}) {
  const uiManager = useUIManager();

  const [hotkeys, setHotkeys] = useState<Hotkey[]>([]);

  const getPlanetHotkeys = () => {
    return `${uiManager.getContractAddress()}-${uiManager
      .getAccount()
      ?.toLowerCase()}-planetHotKeys`;
  };

  useEffect(() => {
    const planetHotKeys = getPlanetHotkeys();
    const savedHotkeys = localStorage.getItem(planetHotKeys);
    if (savedHotkeys) {
      setHotkeys(JSON.parse(savedHotkeys));
    } else {
      initializeHotkeys();
    }
  }, []);

  const initializeHotkeys = () => {
    const newHotkeys = mainLine.map((key) => ({
      location: undefined,
      key,
    }));
    setHotkeys(newHotkeys);
    saveHotkeys(newHotkeys);
  };

  const saveHotkeys = (hotkeysToSave: Hotkey[]) => {
    const planetHotKeys = getPlanetHotkeys();
    localStorage.setItem(planetHotKeys, JSON.stringify(hotkeysToSave));
  };

  const handleSetLocation = (index: number) => {
    const selectedPlanet = uiManager.getSelectedPlanet();
    if (selectedPlanet !== undefined) {
      const updatedHotkeys = [...hotkeys];
      updatedHotkeys[index].location = selectedPlanet.locationId;
      setHotkeys(updatedHotkeys);
      saveHotkeys(updatedHotkeys);
    } else {
      console.log("Planet not selected to be able set shortcut");
    }
  };

  return (
    <StyledHotkeysMainLinePane>
      {hotkeys.map((hotkey, index) => (
        <div key={index} style={{ display: "flex", marginInline: 0 }}>
          <HotkeyThumbMainLine
            hotkey={hotkey}
            selectedPlanetVisible={selectedPlanetVisible}
          />
          <Spacer width={1} />
          <SetKeyButtonPlanets onClick={() => handleSetLocation(index)} />
        </div>
      ))}
    </StyledHotkeysMainLinePane>
  );
}

const HotkeyThumbMainLine = ({
  hotkey,
  selectedPlanetVisible,
}: {
  hotkey: Hotkey;
  selectedPlanetVisible: { selectedPlanetVisible: boolean };
}) => {
  const uiManager = useUIManager();
  const planetWrapper = usePlanet(uiManager, hotkey.location);
  const planet = planetWrapper.value;

  const handleClick = () => {
    if (hotkey.location && !selectedPlanetVisible.selectedPlanetVisible) {
      uiManager.centerLocationId(hotkey.location);
    } else {
      console.log("Deselect planet!!!");
    }
  };

  return (
    <HotkeyButton
      className="test"
      onClick={handleClick}
      onShortcutPressed={handleClick}
      shortcutKey={hotkey.key}
      shortcutText={hotkey.key}
      onMouseEnter={() => {
        uiManager?.setHoveringOverPlanet(
          getPlanetHover(hotkey.location as LocationId),
          false,
        );
      }}
      onMouseLeave={() => {
        uiManager?.setHoveringOverPlanet(undefined, false);
      }}
      disabled={selectedPlanetVisible.selectedPlanetVisible}
    >
      {/* For now, we'll display a test image if position is occupied */}
      {hotkey.location ? (
        <PlaceholderImage>
          {planet?.planetLevel}|{getPlanetRank(planet)}
        </PlaceholderImage>
      ) : (
        <div>{hotkey.key}</div>
      )}
    </HotkeyButton>
  );
};

function getPlanetHover(locationId: LocationId): LocatablePlanet | undefined {
  const origPlanet: Planet | undefined = ui.getPlanetWithId(locationId);
  const location: WorldLocation | undefined =
    ui.getLocationOfPlanet(locationId);

  if (!origPlanet && !location) {
    return undefined;
  }

  const locatedAblePlanet: LocatablePlanet = {
    ...(origPlanet as Planet),
    location: location as WorldLocation,
    biome: location?.biomebase as Biome,
  };
  return locatedAblePlanet;
}

const PlaceholderImage = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  font-size: 10px; /* Adjust font size as needed */
  &:hover::after {
    content: "Hotkey planet"; /* Add your tooltip text */
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: black;
    color: white;
    padding: 0.5em;
    border-radius: 0.25em;
    white-space: nowrap;
    font-size: 85%;
  }
`;

const StyledHotkeysMainLinePane = styled.div`
  position: absolute;
  bottom: 0%;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  z-index: 9989; /* Ensure the button overlays other elements */
`;

const StyledHotkeysArtShipsPane = styled.div`
  position: absolute;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  z-index: 9989; /* Ensure the button overlays other elements */
`;

const HotkeyButton = styled(ShortcutBtn)`
  // Ensure the button has a fixed width and height based on its content
  width: fit-content;
  height: fit-content;

  // Center the content horizontally and vertically
  display: flex;
  justify-content: center;
  align-items: center;

  // Style the internal elements
  .test {
    background: red !important;
  }

  // Remove margin from the last child
  &:last-child {
    margin: 0;
  }

  // Change cursor on hover
  &:hover {
    cursor: pointer;
  }
`;

const SetKeyButtonPlanets = styled(Btn)`
  left: -40px; /* Move 50px to the left */
  bottom: -16px; /* Move 50px to the left */
  position: relative;
  z-index: 9989; /* Ensure the button overlays other elements */
  min-height: 6em;
  .test {
    background: red !important;
  }
  &:last-child {
    margin: none;
  }

  &:hover::after {
    content: "Set hotkey for within opened pane Planet"; /* Add your tooltip text */
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black */
    color: white;
    padding: 0.5em;
    border-radius: 0.25em;
    white-space: nowrap;
    font-size: 85%;
  }
`;

const SetKeyButtonArt = styled(Btn)`
  left: -40px; /* Move 50px to the left */
  bottom: -16px; /* Move 50px to the left */
  position: relative;
  z-index: 9989; /* Ensure the button overlays other elements */
  min-height: 6em;
  .test {
    background: red !important;
  }
  &:last-child {
    margin: none;
  }

  &:hover {
    cursor: pointer;
  }

  &:hover::after {
    content: "Set hotkey within open Pane for Artifact or Ship"; /* Add your tooltip text */
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black */
    color: white;
    padding: 0.5em;
    border-radius: 0.25em;
    white-space: nowrap;
    font-size: 85%;
  }
`;
