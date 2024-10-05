import type { LocationId } from "@df/types";
import React from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { CenterBackgroundSubtext, Spacer } from "../Components/CoreUI";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Blue, Green, White } from "../Components/Text";
import { TextPreview } from "../Components/TextPreview";
import { formatDuration, TimeUntil } from "../Components/TimeUntil";
import dfstyles from "../Styles/dfstyles";
import { useAccount, usePlanet, useUIManager } from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import type { ModalHandle } from "../Views/ModalPane";

const BlueWrapper = styled.div`
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

// export function BluePaneHelpContent() {
//   return (
//     <div>
//       Reveal this planet's location to all other players on-chain!
//       <Spacer height={8} />
//       Broadcasting can be a potent offensive tactic! Reveal a powerful enemy's location, and maybe
//       someone else will take care of them for you?
//     </div>
//   );
// }

export function BluePane({
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
  const planet = usePlanet(uiManager, planetId).value;
  const account = useAccount(uiManager);

  const notice = (
    <CenterBackgroundSubtext width="100%" height="75px">
      You can&apos;t <br /> blue this planet.
    </CenterBackgroundSubtext>
  );

  if (!planetId || !planet || !uiManager) {
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

  const blueLocation = () => {
    if (!planet || !uiManager) {
      return;
    }
    const loc = uiManager.getLocationOfPlanet(planet.locationId);
    if (!loc) {
      return;
    }

    uiManager.blueLocation(loc.hash);
  };

  const isDestoryedOrFrozen = planet?.destroyed || planet?.frozen;
  const planetLevelCheckPassed = planet && planet?.planetLevel >= 3;
  const blueZoneCheckPassed =
    planetId && uiManager.checkPlanetCanBlue(planetId);
  if (isDestoryedOrFrozen || !planetLevelCheckPassed || !blueZoneCheckPassed) {
    return notice;
  }

  const centerPlanetId = uiManager.getBlueZoneCenterPlanetId(planetId);

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
    const requireSilver = uiManager.getBlueRequireSilverAmount(
      planet.planetLevel,
    );
    if (!requireSilver) {
      return false;
    }

    return Math.floor(playerSilver) >= Math.ceil(requireSilver);
  };

  const silverCheckPassed = getSilverPassed();

  const getFormatSilverAmount = () => {
    if (!planet) {
      return "n/a";
    }
    if (!account) {
      return "n/a";
    }
    const res = uiManager.getBlueRequireSilverAmount(planet.planetLevel);
    // console.log(res);
    if (res === undefined) {
      return "n/a";
    } else {
      return res.toLocaleString();
    }
  };
  const formatSilverAmount = getFormatSilverAmount();

  const timeCheckPassed =
    planetId === undefined
      ? false
      : uiManager.getNextBlueAvailableTimestamp(planetId) <= Date.now();

  const notBlueingAnyPlanet = uiManager.isCurrentlyBlueing() === false;

  let blueBtn = undefined;

  if (isDestoryedOrFrozen) {
    blueBtn = <Btn disabled={true}>Blue It </Btn>;
  } else if (!planetLevelCheckPassed) {
    blueBtn = <Btn disabled={true}>Blue It </Btn>;
  } else if (!blueZoneCheckPassed) {
    blueBtn = <Btn disabled={true}>Blue It </Btn>;
  } else if (!timeCheckPassed) {
    blueBtn = <Btn disabled={true}>Blue It </Btn>;
  } else if (!notBlueingAnyPlanet) {
    blueBtn = (
      <Btn disabled={true}>
        <LoadingSpinner initialText={"Blueing It..."} />
      </Btn>
    );
  } else {
    blueBtn = (
      <Btn disabled={false} onClick={blueLocation}>
        Blue It
      </Btn>
    );
  }

  const warningsSection = (
    <div>
      {isDestoryedOrFrozen && (
        <p>
          <Blue>INFO:</Blue> You can&apos;t blue a destoryed/frozen planet.
        </p>
      )}
      {!blueZoneCheckPassed && (
        <p>
          <Blue>INFO:</Blue> You can only blue planets in your blue zones.
        </p>
      )}

      {!silverCheckPassed && (
        <p>
          <Blue>INFO:</Blue> You need at least {formatSilverAmount} silver.
        </p>
      )}

      {!planetLevelCheckPassed && (
        <p>
          <Blue>INFO:</Blue> Planet level need {">="} 3.
        </p>
      )}
      {blueZoneCheckPassed && !timeCheckPassed && planetId && (
        <p>
          <Blue>INFO:</Blue> You must wait{" "}
          <TimeUntil
            timestamp={uiManager.getNextBlueAvailableTimestamp(planetId)}
            ifPassed={"now!"}
          />{" "}
          to blue this planet.
        </p>
      )}
    </div>
  );

  if (planet) {
    return (
      <BlueWrapper>
        <div>
          <Blue>
            Transfer energy from this planet to the planet in the center of the
            blue circle.
          </Blue>
        </div>

        <Spacer height={8} />
        <div>
          <Green>Tip:</Green>
          If the planet is in two blue circles, the energy will be transferred
          to the closer central planet.
        </div>
        <div>
          <Green>Tip:</Green>
          You need to wait{" "}
          <White>
            {formatDuration(
              uiManager.contractConstants.BLUE_PLANET_COOLDOWN * 1000,
            )}
          </White>{" "}
          after kardashev.
        </div>
        <div>
          <Green>Tip:</Green>
          Each time requires the same amount of silver.
        </div>

        <Spacer height={8} />

        {blueZoneCheckPassed && (
          <div className="row">
            <span> Center Planet ID:</span>

            <span>
              <TextPreview
                style={{ color: dfstyles.colors.subtext }}
                text={centerPlanetId}
                focusedWidth={"150px"}
                unFocusedWidth={"150px"}
              />
            </span>
          </div>
        )}

        <div className="row">
          <span>Require silver amount: </span>
          <span>{formatSilverAmount}</span>
        </div>
        <div className="row">
          <span>Coordinates:</span>
          <span>{`(${getLoc().x}, ${getLoc().y})`}</span>
        </div>

        <div className="message">{warningsSection}</div>

        <Spacer height={8} />
        <p style={{ textAlign: "right" }}>{blueBtn}</p>
      </BlueWrapper>
    );
  } else {
    return (
      <CenterBackgroundSubtext width="100%" height="75px">
        Select a Planet
      </CenterBackgroundSubtext>
    );
  }
}
