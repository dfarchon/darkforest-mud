import { formatNumber, isSpaceShip } from "@df/gamelogic";
import { isUnconfirmedMoveTx, isUnconfirmedReleaseTx } from "@df/serde";
import type { Artifact, Planet } from "@df/types";
import { artifactNameFromArtifact, MaterialType, TooltipName } from "@df/types";
import React, { useCallback } from "react";
import styled from "styled-components";

import { StatIdx } from "../../_types/global/GlobalTypes";
import type { Wrapper } from "../../Backend/Utils/Wrapper";
import { Btn } from "../Components/Btn";
import { Icon, IconType } from "../Components/Icons";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { MaybeShortcutButton } from "../Components/MaybeShortcutButton";
import { Row } from "../Components/Row";
import { Slider } from "../Components/Slider";
import { LongDash, Subber } from "../Components/Text";
import { TooltipTrigger } from "../Panes/Tooltip";
import dfstyles from "../Styles/dfstyles";
import {
  useAccount,
  usePlanetInactiveArtifacts,
  useUIManager,
} from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import { useOnUp } from "../Utils/KeyEmitters";
import { TOGGLE_ABANDON, TOGGLE_SEND } from "../Utils/ShortcutConstants";
import { SelectArtifactRow } from "./ArtifactRow";
import {
  getMaterialColor,
  getMaterialName,
} from "@frontend/Panes/PlanetMaterialsPane";

const StyledSendResources = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
`;

const StyledShowPercent = styled.div`
  display: inline-block;

  & > span:first-child {
    width: 3em;
    text-align: right;
    margin-right: 1em;
  }

  & > span:last-child {
    color: ${dfstyles.colors.subtext};
    & > span {
      ${dfstyles.prefabs.noselect};
      &:hover {
        color: ${dfstyles.colors.text};
        cursor: pointer;
      }
      &:first-child {
        margin-right: 0.5em;
      }
    }
  }
`;
function ShowPercent({
  value,
  setValue,
}: {
  value: number;
  setValue: (x: number) => void;
}) {
  return (
    <StyledShowPercent>
      <span>{value}%</span>
      <span>
        <span onClick={() => setValue(value - 1)}>
          <LongDash />
        </span>
        <span onClick={() => setValue(value + 1)}>+</span>
      </span>
    </StyledShowPercent>
  );
}

const ResourceRowDetails = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

export function MaterialIcon({ materialId }: { materialId: number }) {
  return (
    <div
      style={{
        width: "1em",
        height: "1em",
        borderRadius: "3px",
        backgroundColor: getMaterialColor(materialId),
        display: "inline-block",
        marginRight: "6px",
      }}
    />
  );
}

export type Material = {
  materialId: number;
  materialAmount: string | bigint;
  cap: string | bigint;
  growthRate: string | bigint;
  lastTick: number;
};

function ResourceBar({
  isSilver,
  isMaterial,
  selected,
  material,
  value,
  setValue,
  disabled,
}: {
  isSilver?: boolean;
  isMaterial?: boolean;
  selected: Planet | Material | undefined;
  material?: Material;
  value: number;
  setValue: (x: number) => void;
  disabled?: boolean;
}) {
  // const getResource = useCallback(
  //   (val: number): string => {
  //     if (!selected) return "";
  //     console.log("is material1", material);
  //     // MATERIAL
  //     if (isMaterial && material) {
  //       console.log("is material", material);
  //       const amount =
  //         typeof material.amount === "string"
  //           ? parseFloat(material.amount)
  //           : Number(material.amount);
  //       return formatNumber(((val / 100) * amount) / 1e18);
  //     }

  //     // SILVER or ENERGY
  //     const resource = isSilver
  //       ? (selected as Planet).silver
  //       : (selected as Planet).energy;
  //     return formatNumber((val / 100) * resource);
  //   },
  //   [selected, isSilver, isMaterial, material],
  // );
  const getResource = useCallback(
    (val: number): string => {
      if (!selected) return "";

      // MATERIAL
      if (isMaterial && material) {
        const amount =
          typeof material.materialAmount === "string"
            ? parseFloat(material.materialAmount)
            : Number(material.materialAmount);
        const value = ((val / 100) * amount) / 1e18;

        // e.g., "312.4 MYCELIUM"
        return `${formatNumber(value)}`;
      }

      // SILVER or ENERGY
      const resource = isSilver
        ? (selected as Planet).silver
        : (selected as Planet).energy;

      const label = isSilver ? "SILVER" : "ENERGY";
      const value = (val / 100) * resource;

      return `${formatNumber(value)}`;
    },
    [selected, isSilver, isMaterial, material],
  );
  return (
    <>
      {/* <Row>
        <ResourceRowDetails>
          {isMaterial && material?.length > 0 ? (
            <>
              <Icon type={IconType.Frozen} />
              {material[1].amount}
            </>
          ) : isSilver ? (
            <>
              <Icon type={IconType.Silver} />
              {getResource(value)}
            </>
          ) : (
            <>
              <Icon type={IconType.Energy} />
              {getResource(value)}
            </>
          )}
        </ResourceRowDetails>

        <ShowPercent value={value} setValue={setValue} />
      </Row> */}
      <Row>
        <ResourceRowDetails>
          {(() => {
            if (isMaterial && material) {
              return (
                <>
                  <MaterialIcon materialId={material.materialId} />
                  {getResource(value)}
                  <Subber>{getMaterialName(material.materialId)}</Subber>
                </>
              );
            }

            if (isSilver) {
              return (
                <>
                  <Icon type={IconType.Silver} />
                  {getResource(value)}
                  <Subber>Silver</Subber>
                </>
              );
            }

            return (
              <>
                <Icon type={IconType.Energy} />
                {getResource(value)}
                <Subber>Energy</Subber>
              </>
            );
          })()}
        </ResourceRowDetails>

        <ShowPercent value={value} setValue={setValue} />
      </Row>
      <Slider
        variant="filled"
        labelVisibility="none"
        min={0}
        max={100}
        value={value}
        step={1}
        disabled={disabled}
        onChange={(e: Event & React.ChangeEvent<HTMLInputElement>) => {
          setValue(parseInt(e.target.value, 10));
        }}
      />
    </>
  );
}

function AbandonButton({
  planet,
  abandoning,
  toggleAbandoning,
  disabled,
}: {
  planet?: Planet;
  abandoning: boolean;
  toggleAbandoning: () => void;
  disabled?: boolean;
}) {
  const uiManager = useUIManager();

  if (!planet) {
    return null;
  }

  let junk = uiManager.getDefaultSpaceJunkForPlanetLevel(planet?.planetLevel);
  if (planet.bonus[StatIdx.SpaceJunk]) {
    junk /= 2;
  }
  /* Explicitly avoid binding to `onShortcutPressed` so we can support sending on subpanes */
  return (
    <MaybeShortcutButton
      size="stretch"
      active={abandoning}
      onClick={toggleAbandoning}
      shortcutKey={TOGGLE_ABANDON}
      shortcutText={TOGGLE_ABANDON}
      disabled={planet.isHomePlanet || disabled}
    >
      <TooltipTrigger name={TooltipName.Abandon}>
        {abandoning ? "Abandoning" : `Abandon Planet (-${junk}) space junk`}
      </TooltipTrigger>
    </MaybeShortcutButton>
  );
}

function SendRow({
  toggleSending,
  artifact,
  sending,
  abandoning,
  disabled = false,
}: {
  toggleSending: () => void;
  artifact: Artifact | undefined;
  sending: boolean;
  abandoning?: boolean;
  disabled?: boolean;
}) {
  let content = "Send";
  if (artifact) {
    const artifactName = artifactNameFromArtifact(artifact);
    if (isSpaceShip(artifact.artifactType)) {
      // Call it "Move" with a spaceship, instead of "Send"
      content = `Move ${artifactName}`;
    } else {
      // Only add the "+" if we are sending Energy & Artifact
      content += ` + ${artifactName}`;
    }
  }
  if (abandoning) {
    content += " and Abandon";
  }
  /* Explicitly avoid binding to `onShortcutPressed` so we can support sending on subpanes */
  return (
    <MaybeShortcutButton
      size="stretch"
      onClick={toggleSending}
      active={sending}
      shortcutKey={TOGGLE_SEND}
      shortcutText={TOGGLE_SEND}
      disabled={disabled}
    >
      {content}
    </MaybeShortcutButton>
  );
}

export function SendResources({
  planetWrapper: p,
  onToggleSendForces,
  onToggleAbandon,
}: {
  planetWrapper: Wrapper<Planet | undefined>;
  onToggleSendForces: () => void;
  onToggleAbandon: () => void;
}) {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();
  const account = useAccount(uiManager);

  const canDelegate = gameManager.checkDelegateCondition(
    p.value?.owner,
    account,
  );

  const owned = p.value?.owner === account || canDelegate;

  const locationId = p?.value?.locationId;

  const isSendingShip = uiManager.isSendingShip(locationId);

  const isAbandoning = useEmitterValue(uiManager.isAbandoning$, false);
  const isSendingForces = useEmitterValue(uiManager.isSending$, false);
  const energySending = uiManager.getForcesSending(locationId);
  const silverSending = uiManager.getSilverSending(locationId);
  const artifactSending = uiManager.getArtifactSending(locationId);

  const disableSliders = isSendingShip || isAbandoning;

  const activeMaterials =
    p.value?.materials?.filter(
      (mat) => mat.materialId !== 0 && mat.materialAmount > 0,
    ) || [];

  const materialSending = activeMaterials.map((mat) => ({
    materialId: mat.materialId,
    value: uiManager.getMaterialSending(locationId, mat.materialId),
  }));

  const updateEnergySending = useCallback(
    (energyPercent) => {
      if (!locationId) {
        return;
      }
      uiManager.setForcesSending(locationId, energyPercent);
    },
    [uiManager, locationId],
  );

  const updateSilverSending = useCallback(
    (silverPercent) => {
      if (!locationId) {
        return;
      }
      uiManager.setSilverSending(locationId, silverPercent);
    },
    [uiManager, locationId],
  );

  const updateMaterialSending = useCallback(
    (materialPercent) => {
      if (!locationId) {
        return;
      }
      uiManager.setMaterialSending(
        locationId,
        materialSending.materialId,
        materialPercent,
      );
    },
    [uiManager, locationId],
  );

  const updateArtifactSending = useCallback(
    (sendArtifact) => {
      if (!locationId) {
        return;
      }
      uiManager.setArtifactSending(locationId, sendArtifact);
    },
    [uiManager, locationId],
  );

  // this variable is an array of 10 elements. each element is a key. whenever the user presses a
  // key, we set the amount of energy that we're sending to be proportional to how late in the array
  // that key is
  const energyShortcuts = "1234567890".split("");

  // same as above, except for silver
  const silverShortcuts = "!@#$%^&*()".split("");

  // for each of the above keys, we set up a listener that is triggered whenever that key is
  // pressed, and sets the corresponding resource sending amount
  for (let i = 0; i < energyShortcuts.length; i++) {
    useOnUp(energyShortcuts[i], () => updateEnergySending((i + 1) * 10), [
      updateEnergySending,
    ]);
    useOnUp(silverShortcuts[i], () => updateSilverSending((i + 1) * 10), [
      updateSilverSending,
    ]);
  }

  useOnUp(
    "-",
    () => {
      updateEnergySending(uiManager.getForcesSending(locationId) - 10);
    },
    [uiManager, locationId, updateEnergySending],
  );
  useOnUp(
    "=",
    () => {
      updateEnergySending(uiManager.getForcesSending(locationId) + 10);
    },
    [uiManager, locationId, updateEnergySending],
  );
  useOnUp(
    "_",
    () => {
      updateSilverSending(uiManager.getSilverSending(locationId) - 10);
    },
    [uiManager, locationId, updateSilverSending],
  );
  useOnUp(
    "+",
    () => {
      updateSilverSending(uiManager.getSilverSending(locationId) + 10);
    },
    [uiManager, locationId, updateSilverSending],
  );

  const artifacts = usePlanetInactiveArtifacts(p, uiManager);
  const spaceshipsYouOwn = artifacts.filter(
    (a) => isSpaceShip(a.artifactType) && a.controller === account,
  );

  let abandonRow;
  if (p.value && p.value.transactions?.hasTransaction(isUnconfirmedReleaseTx)) {
    abandonRow = (
      <Btn size="stretch" disabled>
        <LoadingSpinner initialText="Abandoning..." />
      </Btn>
    );
  } else if (p.value && !p.value.destroyed && !p.value.frozen) {
    abandonRow = (
      <AbandonButton
        planet={p.value}
        abandoning={isAbandoning && !isSendingShip}
        toggleAbandoning={onToggleAbandon}
        disabled={isSendingShip}
      />
    );
  }

  let sendRow;
  if (p.value && p.value.transactions?.hasTransaction(isUnconfirmedMoveTx)) {
    sendRow = (
      <Btn size="stretch" disabled>
        <LoadingSpinner
          initialText={isSendingShip ? "Moving..." : "Sending..."}
        />
      </Btn>
    );
  } else {
    const isDisabled =
      (p.value?.destroyed || p.value?.frozen || !owned) && !isSendingShip;
    sendRow = (
      <SendRow
        artifact={artifactSending}
        toggleSending={onToggleSendForces}
        sending={isSendingForces}
        disabled={isDisabled}
      />
    );
  }

  return (
    <StyledSendResources>
      {owned && !p.value?.destroyed && !p.value?.frozen && (
        <>
          <ResourceBar
            selected={p.value}
            value={energySending}
            setValue={updateEnergySending}
            disabled={disableSliders}
          />
          {p.value && p.value.silver > 0 && (
            <ResourceBar
              selected={p.value}
              value={silverSending}
              setValue={updateSilverSending}
              disabled={disableSliders}
              isSilver
            />
          )}
        </>
      )}
      {owned &&
        !p.value?.destroyed &&
        !p.value?.frozen &&
        activeMaterials.length > 0 && (
          <>
            {activeMaterials.map((mat) => (
              <ResourceBar
                key={mat.materialId}
                selected={p.value} // pass full material
                material={mat} // pass full material
                value={uiManager.getMaterialSending(locationId, mat.materialId)}
                setValue={(val) =>
                  uiManager.setMaterialSending(locationId, mat.materialId, val)
                }
                disabled={disableSliders}
                isMaterial // <-- optional prop to distinguish in styling
              />
            ))}
          </>
        )}
      {p.value && artifacts.length > 0 && (
        <SelectArtifactRow
          artifacts={artifacts}
          onArtifactChange={updateArtifactSending}
          selectedArtifact={artifactSending}
        />
      )}
      {spaceshipsYouOwn.length > 0 || owned ? sendRow : null}

      {/* {uiManager.getSpaceJunkEnabled() && owned ? abandonRow : null} */}
    </StyledSendResources>
  );
}
