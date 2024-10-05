import type { LocationId } from "@df/types";
import { ArtifactType } from "@df/types";
import React from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { CenterBackgroundSubtext, Spacer } from "../Components/CoreUI";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Blue, Green, White } from "../Components/Text";
import { formatDuration, TimeUntil } from "../Components/TimeUntil";
import dfstyles from "../Styles/dfstyles";
import { useActiveArtifact, usePlanet, useUIManager } from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import type { ModalHandle } from "../Views/ModalPane";

const PinkWrapper = styled.div`
  & .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    & > span {
      &:first-child {
        color: ${dfstyles.colors.subtext};
        padding-right: 1em;
      }
    }
  }
  & .message {
    margin: 1em 0;

    & p {
      margin: 0.5em 0;

      &:last-child {
        margin-bottom: 1em;
      }
    }
  }
`;

// export function PinkPaneHelpContent() {
//   return (
//     <div>
//       Reveal this planet's location to all other players on-chain!
//       <Spacer height={8} />
//       Broadcasting can be a potent offensive tactic! Reveal a powerful enemy's location, and maybe
//       someone else will take care of them for you?
//     </div>
//   );
// }

export function PinkPane({
  initialPlanetId,
  modal: _modal,
}: {
  modal?: ModalHandle;
  initialPlanetId: LocationId | undefined;
}) {
  const uiManager = useUIManager();
  const planetId = useEmitterValue(
    uiManager.selectedPlanetId$,
    initialPlanetId,
  );
  const planetWrapper = usePlanet(uiManager, planetId);
  const planet = usePlanet(uiManager, planetId).value;
  const activeArtifact = useActiveArtifact(planetWrapper, uiManager);

  const notice = (
    <CenterBackgroundSubtext width="100%" height="75px">
      You can&apos;t <br /> pink this planet.
    </CenterBackgroundSubtext>
  );

  if (!planet || !uiManager) {
    return notice;
  }

  const getLoc = () => {
    if (!planet || !uiManager) {
      return { x: 0, y: 0 };
    }
    const loc = uiManager.getLocationOfPlanet(planet.locationId);
    if (!loc) {
      return { x: 0, y: 0 };
    }
    return loc.coords;
  };

  const pinkLocation = () => {
    if (!planet || !uiManager) {
      return;
    }
    const loc = uiManager.getLocationOfPlanet(planet.locationId);
    if (!loc) {
      return;
    }
    uiManager.pinkLocation(loc.hash);
  };

  const isDestoryedOrFrozen = planet.destroyed || planet.frozen;
  const levelPassed = planet ? planet.planetLevel >= 3 : false;
  const pinkZonePassed = planetId && uiManager.checkPlanetCanPink(planetId);

  if (isDestoryedOrFrozen || !levelPassed || !pinkZonePassed) {
    return notice;
  }

  const pinkLocationCooldownPassed =
    planetId && ui.getNextPinkAvailableTimestamp(planetId) <= Date.now();

  const hasStellarShield =
    activeArtifact &&
    activeArtifact.artifactType === ArtifactType.StellarShield;
  const notPinkingAnyPlanet = uiManager.isCurrentlyPinking() === false;

  let pinkBtn = undefined;

  if (isDestoryedOrFrozen) {
    pinkBtn = <Btn disabled={true}>Pink It </Btn>;
  } else if (!notPinkingAnyPlanet) {
    pinkBtn = (
      <Btn disabled={true}>
        <LoadingSpinner initialText={"Pinking It..."} />
      </Btn>
    );
  } else if (!pinkLocationCooldownPassed) {
    pinkBtn = <Btn disabled={true}>Pink It </Btn>;
  } else if (!pinkZonePassed) {
    pinkBtn = <Btn disabled={true}>Pink It </Btn>;
  } else if (hasStellarShield) {
    pinkBtn = <Btn disabled={true}>Pink It </Btn>;
  } else if (!levelPassed) {
    pinkBtn = <Btn disabled={true}>Pink It </Btn>;
  } else {
    pinkBtn = (
      <Btn disabled={false} onClick={pinkLocation}>
        Pink It
      </Btn>
    );
  }

  const warningsSection = (
    <div>
      {!pinkZonePassed && (
        <p>
          <Blue>INFO:</Blue> You only can pink planets in your pink circle.
        </p>
      )}
      {hasStellarShield && (
        <p>
          <Blue>INFO:</Blue> You can&apos;t pink a planet with active
          StellarShield.
        </p>
      )}

      {pinkZonePassed && !pinkLocationCooldownPassed && planetId && (
        <p>
          <Blue>INFO:</Blue> You must wait{" "}
          <TimeUntil
            timestamp={uiManager.getNextPinkAvailableTimestamp(planetId)}
            ifPassed={"now!"}
          />{" "}
          to pink this planet.
        </p>
      )}
    </div>
  );

  if (planet) {
    return (
      <PinkWrapper>
        <div>
          <Green>Tip:</Green> You need to wait{" "}
          <White>
            {formatDuration(
              uiManager.contractConstants.PINK_PLANET_COOLDOWN * 1000,
            )}
          </White>{" "}
          after dropping bomb.
        </div>
        <div className="message">{warningsSection}</div>
        <div className="row">
          <span>Coordinates</span>
          <span>{`(${getLoc().x}, ${getLoc().y})`}</span>
        </div>
        <Spacer height={8} />
        <p style={{ textAlign: "right" }}>{pinkBtn}</p>
      </PinkWrapper>
    );
  } else {
    return (
      <CenterBackgroundSubtext width="100%" height="75px">
        Select a Planet
      </CenterBackgroundSubtext>
    );
  }
}
