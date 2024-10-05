import { EMPTY_ADDRESS } from "@df/constants";
import { isLocatable } from "@df/gamelogic";
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
import {
  useAccount,
  useActiveArtifact,
  usePlanet,
  usePlayer,
  useUIManager,
} from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import type { ModalHandle } from "../Views/ModalPane";

const DropBombWrapper = styled.div`
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

// export function DropBombPaneHelpContent() {
//   return (
//     <div>
//       Reveal this planet's location to all other players on-chain!
//       <Spacer height={8} />
//       Broadcasting can be a potent offensive tactic! Reveal a powerful enemy's location, and maybe
//       someone else will take care of them for you?
//     </div>
//   );
// }

export function DropBombPane({
  initialPlanetId,
  modal: _modal,
}: {
  modal?: ModalHandle;
  initialPlanetId: LocationId | undefined;
}) {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();

  const planetId = useEmitterValue(
    uiManager.selectedPlanetId$,
    initialPlanetId,
  );
  const account = useAccount(uiManager);
  const player = usePlayer(uiManager).value;
  const planetWrapper = usePlanet(uiManager, planetId);
  const planet = planetWrapper.value;
  const activeArtifact = useActiveArtifact(planetWrapper, uiManager);

  const notice = (
    <CenterBackgroundSubtext width="100%" height="75px">
      You can&apos;t <br /> drop bomb to this planet.
    </CenterBackgroundSubtext>
  );
  if (!account || !player || !planet) {
    return notice;
  }

  const planetIsLocatable = isLocatable(planet);
  const notDestoryedOrFrozen = !planet.destroyed && !planet.frozen;
  const levelCheckPassed = planet.planetLevel >= 3;
  const ownerCheckPassed = planet.owner === account;
  const burnOperatorCheckPassed =
    planet.burnOperator === undefined || planet.burnOperator === EMPTY_ADDRESS;

  if (
    !planetIsLocatable ||
    !notDestoryedOrFrozen ||
    !levelCheckPassed ||
    !ownerCheckPassed ||
    !burnOperatorCheckPassed
  ) {
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

  const dropBomb = () => {
    if (!planet || !uiManager) {
      return;
    }
    const loc = uiManager.getLocationOfPlanet(planet.locationId);
    if (!loc) {
      return;
    }

    uiManager.burnLocation(loc.hash);
  };

  const notBurningAnyPlanet = uiManager.isCurrentlyBurning() === false;
  const burnLocationCooldownPassed =
    uiManager.getNextBurnAvailableTimestamp() <= Date.now();

  const getDropBombAmount = () => {
    const player = uiManager.getPlayer(account);
    if (!player) {
      return 0;
    }
    return player.dropBombAmount;
  };

  const getSilverPassed = () => {
    if (!planet) {
      return false;
    }
    if (!account) {
      return false;
    }
    const playerSilver = uiManager.getPlayerSilver(account);
    if (playerSilver === undefined) {
      return false;
    }
    const requireSilver = uiManager.getSilverOfBurnPlanet(
      account,
      planet.planetLevel,
    );
    if (!requireSilver) {
      return false;
    }
    return Math.floor(playerSilver) >= Math.ceil(requireSilver);
  };

  const getFormatSilverAmount = () => {
    if (!planet) {
      return "n/a";
    }
    if (!account) {
      return "n/a";
    }
    const res = uiManager.getSilverOfBurnPlanet(account, planet.planetLevel);
    if (res === undefined) {
      return "n/a";
    } else {
      return res.toLocaleString();
    }
  };

  const formatSilverAmount = getFormatSilverAmount();
  const silverPassed = getSilverPassed();

  const activeArtifactCheckPassed =
    activeArtifact && activeArtifact.artifactType === ArtifactType.Bomb;
  const artifactCooldownPassed =
    activeArtifactCheckPassed &&
    Date.now() >=
      1000 *
        (activeArtifact.lastActivated +
          gameManager.getContractConstants().BURN_PLANET_COOLDOWN);

  const getTimestamp = () => {
    if (!activeArtifactCheckPassed) {
      return 0;
    }
    return (
      1000 *
      (activeArtifact.lastActivated +
        gameManager.getContractConstants().BURN_PLANET_COOLDOWN)
    );
  };

  const disabled =
    !notBurningAnyPlanet ||
    !burnLocationCooldownPassed ||
    !silverPassed ||
    !activeArtifactCheckPassed ||
    !artifactCooldownPassed;

  let content = <></>;

  if (!notBurningAnyPlanet) {
    content = <LoadingSpinner initialText={"Dropping Bomb..."} />;
  } else if (!burnLocationCooldownPassed) {
    content = <> Wait For Drop Bomb Cooldown</>;
  } else if (!silverPassed) {
    content = <> Not Enough Silver</>;
  } else if (!activeArtifactCheckPassed) {
    content = <>Require Active Bomb Artifact</>;
  } else if (!artifactCooldownPassed) {
    content = <>Wait For Artifact Cooldown</>;
  } else {
    content = <>Drop Bomb</>;
  }

  const warningsSection = (
    <div>
      {!burnLocationCooldownPassed && (
        <p>
          <Blue>INFO:</Blue> [DROP BOMB COOLDOWN] You must wait{" "}
          <TimeUntil
            timestamp={uiManager.getNextBurnAvailableTimestamp()}
            ifPassed={"now!"}
          />{" "}
          to burn another planet.
        </p>
      )}

      {!silverPassed && (
        <p>
          <Blue>INFO:</Blue> You need at least {formatSilverAmount} silver.
        </p>
      )}

      {!activeArtifactCheckPassed && (
        <p>
          <Blue>INFO:</Blue> Please activate Bomb artifact on this planet.
        </p>
      )}

      {activeArtifactCheckPassed && !artifactCooldownPassed && (
        <p>
          <Blue>INFO:</Blue> {" [ARTIFACT COOLDOWN] You must wait "}
          <TimeUntil timestamp={getTimestamp()} ifPassed={"now!"} />{" "}
        </p>
      )}
    </div>
  );

  if (planet) {
    return (
      <DropBombWrapper>
        <div>
          <Green>Tip:</Green>
          You can only drop bomb to a planet once every{" "}
          <White>
            {formatDuration(
              uiManager.contractConstants.BURN_PLANET_COOLDOWN * 1000,
            )}
          </White>
          .
        </div>

        <div>
          <Green>Tip:</Green> After activating the Bomb artifact, you need to
          wait for{" "}
          <White>
            {formatDuration(
              uiManager.contractConstants.BURN_PLANET_COOLDOWN * 1000,
            )}
          </White>
          .
        </div>

        <div>
          <Green>Tip:</Green>
          After dropping bomb, the next required silver amount will be
          multiplied by 10.
        </div>
        <Spacer height={8} />

        <div className="row">
          <span>Your dropped bomb amount:</span>
          <span>{getDropBombAmount()}</span>
        </div>

        <div className="row">
          <span>Require silver amount: </span>
          <span> {formatSilverAmount} </span>
        </div>
        <div className="message">{warningsSection}</div>
        <div className="row">
          <span>Coordinates</span>
          <span>{`(${getLoc().x}, ${getLoc().y})`}</span>
        </div>
        <Spacer height={8} />
        <Btn disabled={disabled} onClick={dropBomb}>
          {content}
        </Btn>
      </DropBombWrapper>
    );
  } else {
    return (
      <CenterBackgroundSubtext width="100%" height="75px">
        Select a Planet
      </CenterBackgroundSubtext>
    );
  }
}
