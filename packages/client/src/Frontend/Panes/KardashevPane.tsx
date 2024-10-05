import { EMPTY_ADDRESS } from "@df/constants";
import { isLocatable } from "@df/gamelogic";
import type { LocationId } from "@df/types";
import { ArtifactType } from "@df/types";
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

const KardashevWrapper = styled.div`
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

// export function KardashevPaneHelpContent() {
//   return (
//     <div>
//       Reveal this planet's location to all other players on-chain!
//       <Spacer height={8} />
//       Broadcasting can be a potent offensive tactic! Reveal a powerful enemy's location, and maybe
//       someone else will take care of them for you?
//     </div>
//   );
// }

export function KardashevPane({
  initialPlanetId,
  modal: _modal,
}: {
  modal?: ModalHandle;
  initialPlanetId: LocationId | undefined;
}) {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();
  const account = useAccount(uiManager);
  const player = usePlayer(uiManager).value;
  const planetId = useEmitterValue(
    uiManager.selectedPlanetId$,
    initialPlanetId,
  );
  const planetWrapper = usePlanet(uiManager, planetId);
  const planet = planetWrapper.value;

  const activeArtifact = useActiveArtifact(planetWrapper, uiManager);

  const notice = (
    <CenterBackgroundSubtext width="100%" height="75px">
      You can&apos;t <br /> kardashev this planet.
    </CenterBackgroundSubtext>
  );

  if (!account || !player || !planet) {
    return notice;
  }

  const planetIsLocatable = isLocatable(planet);
  const notDestoryedOrFrozen = !planet.destroyed && !planet?.frozen;
  const levelCheckPassed = planet.planetLevel >= 3;
  const ownerCheckPassed = planet.owner === account;
  const kardashevOperatorCheckPassed =
    planet.kardashevOperator === undefined ||
    planet.kardashevOperator === EMPTY_ADDRESS;

  if (
    !planetIsLocatable ||
    !notDestoryedOrFrozen ||
    !levelCheckPassed ||
    !ownerCheckPassed ||
    !kardashevOperatorCheckPassed
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

  const func = async () => {
    if (!planet || !uiManager) {
      return;
    }
    const loc = uiManager.getLocationOfPlanet(planet.locationId);
    if (!loc) {
      return;
    }
    await uiManager.kardashev(loc.hash);
  };

  const notKardashevingAnyPlanet =
    uiManager.isCurrentlyKardasheving() === false;

  const kardashevCooldownPassed =
    uiManager.getNextKardashevAvailableTimestamp() <= Date.now();

  const silverAmountPassed =
    uiManager.getKardashevRequireSilverAmount(planet.planetLevel) <=
    player.silver;

  const activeArtifactCheckPased =
    activeArtifact && activeArtifact.artifactType === ArtifactType.Kardashev;

  const artifactCooldownPassed =
    activeArtifactCheckPased &&
    Date.now() >=
      1000 *
        (activeArtifact.lastActivated +
          gameManager.getContractConstants().KARDASHEV_PLANET_COOLDOWN);

  const getFormatSilverAmount = () => {
    if (!planet) {
      return "n/a";
    }
    if (!account) {
      return "n/a";
    }
    const res = uiManager.getKardashevRequireSilverAmount(planet.planetLevel);
    // console.log(res);
    if (res === undefined) {
      return "n/a";
    } else {
      return res.toLocaleString();
    }
  };
  const formatSilverAmount = getFormatSilverAmount();

  const getTimestamp = () => {
    if (!activeArtifactCheckPased) {
      return 0;
    }
    return (
      1000 *
      (activeArtifact.lastActivated +
        gameManager.getContractConstants().KARDASHEV_PLANET_COOLDOWN)
    );
  };

  const disabled =
    !notKardashevingAnyPlanet ||
    !kardashevCooldownPassed ||
    !silverAmountPassed ||
    !activeArtifactCheckPased ||
    !artifactCooldownPassed;

  let buttonContent = <></>;

  if (!notKardashevingAnyPlanet) {
    buttonContent = <LoadingSpinner initialText={"Kardasheving..."} />;
  } else if (!kardashevCooldownPassed) {
    buttonContent = <>Wait For Operation Cooldown </>;
  } else if (!silverAmountPassed) {
    buttonContent = <>Not Enough Silver</>;
  } else if (!activeArtifactCheckPased) {
    buttonContent = <>Need Active Karhashev Artifact</>;
  } else if (!artifactCooldownPassed) {
    buttonContent = <>Wait For Artifact Cooldown</>;
  } else {
    buttonContent = <>Kardashev</>;
  }

  const warningsSection = (
    <div>
      {!notKardashevingAnyPlanet && (
        <p>
          <Blue>INFO:</Blue> Kardshaeving...
        </p>
      )}

      {!kardashevCooldownPassed && (
        <p>
          <Blue>INFO:</Blue> {" [KARDASHEV COOLDOWN] You must wait "}
          <TimeUntil
            timestamp={uiManager.getNextKardashevAvailableTimestamp()}
            ifPassed={"now!"}
          />{" "}
        </p>
      )}

      {!silverAmountPassed && (
        <p>
          <Blue>INFO:</Blue> You need at least {formatSilverAmount} silver.
        </p>
      )}

      {!activeArtifactCheckPased && (
        <p>
          <Blue>INFO:</Blue> Please activate Kardashev Artifact on this planet.
        </p>
      )}

      {activeArtifactCheckPased && !artifactCooldownPassed && (
        <p>
          <Blue>INFO:</Blue> {" [ARTIFACT COOLDOWN] You must wait "}
          <TimeUntil timestamp={getTimestamp()} ifPassed={"now!"} />{" "}
        </p>
      )}
    </div>
  );

  return (
    <KardashevWrapper>
      <div>
        <Green>Tip:</Green>
        You can only kardashev a planet once every{" "}
        <White>
          {formatDuration(
            uiManager.contractConstants.KARDASHEV_PLANET_COOLDOWN * 1000,
          )}
        </White>
        .
      </div>

      <div>
        <Green>Tip:</Green> After activating the Kardashev artifact, you need to
        wait for{" "}
        <White>
          {formatDuration(
            uiManager.contractConstants.KARDASHEV_PLANET_COOLDOWN * 1000,
          )}
        </White>
        .
      </div>

      <div className="row">
        <span>Your kardashev amount:</span>
        <span>{player.kardashevAmount}</span>
      </div>

      <div className="row">
        <span>Require silver amount:</span>
        <span>{formatSilverAmount} </span>
      </div>
      <div className="message">{warningsSection}</div>
      <div className="row">
        <span>Coordinates</span>
        <span>{`(${getLoc().x}, ${getLoc().y})`}</span>
      </div>
      <Spacer height={8} />
      <Btn disabled={disabled} onClick={func}>
        {buttonContent}
      </Btn>
    </KardashevWrapper>
  );
}
