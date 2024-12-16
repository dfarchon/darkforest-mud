import {
  canActivateArtifact,
  canDepositArtifact,
  canWithdrawArtifact,
  durationUntilArtifactAvailable,
  isActivated,
  isLocatable,
} from "@df/gamelogic";
import {
  isUnconfirmedActivateArtifactTx,
  isUnconfirmedChargeArtifactTx,
  isUnconfirmedDeactivateArtifactTx,
  isUnconfirmedShutdownArtifactTx,
  isUnconfirmedDepositArtifactTx,
  isUnconfirmedWithdrawArtifactTx,
} from "@df/serde";
import type { Artifact, ArtifactId, LocationId } from "@df/types";
import {
  ArtifactStatus,
  ArtifactGenre,
  PlanetFlagType,
  ArtifactType,
  TooltipName,
} from "@df/types";
import React, { useCallback } from "react";

import { Btn } from "../../Components/Btn";
import { Spacer } from "../../Components/CoreUI";
import { ArtifactRarityLabelAnim } from "../../Components/Labels/ArtifactLabels";
import { LoadingSpinner } from "../../Components/LoadingSpinner";
import { Sub } from "../../Components/Text";
import { formatDuration } from "../../Components/TimeUntil";
import {
  useAccount,
  useArtifact,
  usePlanet,
  usePlanetArtifacts,
  useUIManager,
} from "../../Utils/AppHooks";
import { DropBombPane } from "../DropBombPane";
import type { TooltipTriggerProps } from "../Tooltip";
import { TooltipTrigger } from "../Tooltip";

export function ArtifactActions({
  artifactId,
  depositOn,
}: {
  artifactId: ArtifactId;
  depositOn?: LocationId;
}) {
  const uiManager = useUIManager();
  const account = useAccount(uiManager);
  const artifactWrapper = useArtifact(uiManager, artifactId);
  const artifact = artifactWrapper.value;

  const depositPlanetWrapper = usePlanet(uiManager, depositOn);
  const onPlanetWrapper = usePlanet(uiManager, artifact?.onPlanetId);
  const depositPlanet = depositPlanetWrapper.value;
  const onPlanet = onPlanetWrapper.value;

  const otherArtifactsOnPlanet = usePlanetArtifacts(onPlanetWrapper, uiManager);

  // const currentBlockNumber = useEmitterValue(uiManager.getEthConnection().blockNumber$, undefined);
  // //active artifact
  // //myTodo: 2 min 1 artifact
  // const deltaTime = 2;
  // const maxAmount = currentBlockNumber
  //   ? Math.floor(
  //       ((currentBlockNumber - uiManager.contractConstants.GAME_START_BLOCK) * 2.0) /
  //         (60 * deltaTime)
  //     )
  //   : 0;
  // const activateArtifactAmountInContract = account
  //   ? uiManager.getPlayerActivateArtifactAmount(account)
  //   : 0;
  // const activateArtifactAmount = activateArtifactAmountInContract
  //   ? activateArtifactAmountInContract
  //   : 0;

  // const withdraw = useCallback(
  //   (artifact: Artifact) => {
  //     onPlanet && uiManager.withdrawArtifact(onPlanet.locationId, artifact?.id);
  //   },
  //   [onPlanet, uiManager],
  // );

  // const deposit = useCallback(
  //   (artifact: Artifact) => {
  //     artifact &&
  //       depositPlanetWrapper.value &&
  //       uiManager.depositArtifact(
  //         depositPlanetWrapper.value.locationId,
  //         artifact?.id,
  //       );
  //   },
  //   [uiManager, depositPlanetWrapper.value],
  // );

  const charge = useCallback(
    async (artifact: Artifact) => {
      if (onPlanet && isLocatable(onPlanet)) {
        let targetPlanetId = undefined;

        if (artifact.artifactType === ArtifactType.Bomb) {
          const targetPlanet = await uiManager.startLinkFrom(
            onPlanet,
            artifact,
          );
          targetPlanetId = targetPlanet?.locationId;
        }

        uiManager.chargeArtifact(
          onPlanet.locationId,
          artifact.id,
          targetPlanetId ? `0x${targetPlanetId.toString()}` : "0x",
        );
      }
    },
    [onPlanet, uiManager],
  );

  const activate = useCallback(
    async (artifact: Artifact) => {
      if (onPlanet && isLocatable(onPlanet)) {
        let targetPlanetId = undefined;

        if (artifact.artifactType === ArtifactType.Wormhole) {
          const targetPlanet = await uiManager.startLinkFrom(
            onPlanet,
            artifact,
          );
          targetPlanetId = targetPlanet?.locationId;
        }

        uiManager.activateArtifact(
          onPlanet.locationId,
          artifact.id,
          targetPlanetId,
        );
      }
    },
    [onPlanet, uiManager],
  );

  const shutdown = useCallback(
    (artifact: Artifact) => {
      onPlanet && uiManager.shutdownArtifact(onPlanet.locationId, artifact.id);
    },
    [onPlanet, uiManager],
  );

  const deactivate = useCallback(
    (artifact: Artifact) => {
      onPlanet &&
        uiManager.deactivateArtifact(
          onPlanet.locationId,
          artifact.id,
          artifact.linkTo,
        );
    },
    [onPlanet, uiManager],
  );

  // if (!artifact || (!onPlanet && !depositPlanet) || !account) {
  //   return null;
  // }
  if (!artifact || !onPlanet || !account) {
    return null;
  }

  const actions: TooltipTriggerProps[] = [];

  // const withdrawing = artifact.transactions?.hasTransaction(
  //   isUnconfirmedWithdrawArtifactTx,
  // );
  // const depositing = artifact.transactions?.hasTransaction(
  //   isUnconfirmedDepositArtifactTx,
  // );
  const activating = artifact.transactions?.hasTransaction(
    isUnconfirmedActivateArtifactTx,
  );
  const deactivating = artifact.transactions?.hasTransaction(
    isUnconfirmedDeactivateArtifactTx,
  );
  const charging = artifact.transactions?.hasTransaction(
    isUnconfirmedChargeArtifactTx,
  );
  const shuttingDown = artifact.transactions?.hasTransaction(
    isUnconfirmedShutdownArtifactTx,
  );

  // const canHandleDeposit =
  //   depositPlanetWrapper.value &&
  //   depositPlanetWrapper.value.planetLevel > artifact.rarity;
  // const canHandleWithdraw =
  //   onPlanetWrapper.value &&
  //   onPlanetWrapper.value.planetLevel > artifact.rarity;

  // const wait = durationUntilArtifactAvailable(artifact);

  // if (canDepositArtifact(account, artifact, depositPlanetWrapper.value)) {
  //   actions.unshift({
  //     name: TooltipName.DepositArtifact,
  //     extraContent: !canHandleDeposit && (
  //       <>
  //         . <ArtifactRarityLabelAnim rarity={artifact.rarity} />
  //         {` artifacts can only be deposited on level ${artifact.rarity + 1}+ spacetime rips`}
  //       </>
  //     ),
  //     children: (
  //       <Btn
  //         disabled={depositing}
  //         onClick={(e) => {
  //           e.stopPropagation();
  //           canHandleDeposit && deposit(artifact);
  //         }}
  //       >
  //         {depositing ? (
  //           <LoadingSpinner initialText={"Depositing..."} />
  //         ) : (
  //           "Deposit"
  //         )}
  //       </Btn>
  //     ),
  //   });
  // }

  // if (canWithdrawArtifact(account, artifact, onPlanet)) {
  //   actions.unshift({
  //     name: TooltipName.WithdrawArtifact,
  //     extraContent: !canHandleWithdraw && (
  //       <>
  //         . <ArtifactRarityLabelAnim rarity={artifact.rarity} />
  //         {` artifacts can only be withdrawn from level ${artifact.rarity + 1}+ spacetime rips`}
  //       </>
  //     ),
  //     children: (
  //       <Btn
  //         disabled={withdrawing}
  //         onClick={(e) => {
  //           e.stopPropagation();
  //           canHandleWithdraw && withdraw(artifact);
  //         }}
  //       >
  //         {withdrawing ? (
  //           <LoadingSpinner initialText={"Withdrawing..."} />
  //         ) : (
  //           "Withdraw"
  //         )}
  //       </Btn>
  //     ),
  //   });
  // }

  const activateArtifactCooldownPassed = true; // uiManager.getNextActivateArtifactAvailableTimestamp() <= Date.now();

  // if (
  //   canActivateArtifact(artifact, onPlanet, otherArtifactsOnPlanet) &&
  //   ((artifact.artifactType !== ArtifactType.Avatar && maxAmount > activateArtifactAmount) ||
  //     artifact.artifactType === ArtifactType.Avatar)
  // )

  if (
    artifact.genre === undefined ||
    artifact.charge === undefined ||
    artifact.cooldown === undefined ||
    artifact.reqLevel === undefined ||
    artifact.reqPopulation === undefined ||
    artifact.reqSilver === undefined ||
    artifact.status === undefined ||
    artifact.durable === undefined ||
    artifact.reusable === undefined ||
    artifact.rarity === undefined ||
    artifact.chargeTick === undefined ||
    artifact.cooldownTick === undefined ||
    onPlanet.flags === undefined
  ) {
    return null;
  }

  const artifactGenreCheck =
    artifact.genre === ArtifactGenre.General ||
    artifact.genre === ArtifactGenre.Productive ||
    (artifact.genre === ArtifactGenre.Offensive &&
      (onPlanet.flags & (1n << BigInt(PlanetFlagType.OFFENSIVE_ARTIFACT))) ===
        0n) ||
    (artifact.genre === ArtifactGenre.Defensive &&
      (onPlanet.flags & (1n << BigInt(PlanetFlagType.DEFENSIVE_ARTIFACT))) ===
        0n);

  const populationCheck = onPlanet.energy > artifact.reqPopulation;

  const silverCheck = onPlanet.silver >= artifact.reqSilver;

  const levelCheck =
    artifact.reqLevel === 0 ||
    (onPlanet.planetLevel >= (artifact.reqLevel & 0xff) &&
      onPlanet.planetLevel < (artifact.reqLevel & 0xff00) >> 8);

  const canCharge =
    artifact.status === ArtifactStatus.Default &&
    artifact.charge > 0 &&
    artifactGenreCheck &&
    levelCheck;

  const canActivate =
    (artifact.status === ArtifactStatus.Ready ||
      (artifact.status === ArtifactStatus.Default &&
        artifact.charge === 0 &&
        artifactGenreCheck)) &&
    populationCheck &&
    silverCheck &&
    levelCheck;

  const canShutdown =
    artifact.status >= ArtifactStatus.Charging &&
    artifact.status <= ArtifactStatus.Active;

  // console.log("populationCheck", populationCheck);
  // console.log("silverCheck", silverCheck);
  // console.log("levelCheck", levelCheck);
  // console.log("canCharge", canCharge);
  // console.log("canActivate", canActivate);
  // console.log("canShutdown", canShutdown);

  if (canCharge) {
    actions.unshift({
      name: TooltipName.ChargeArtifact,
      children: (
        <Btn
          disabled={charging}
          onClick={(e) => {
            e.stopPropagation();
            charge(artifact);
          }}
        >
          {charging ? <LoadingSpinner initialText={"Charging..."} /> : "Charge"}
        </Btn>
      ),
    });
  }

  if (canActivate) {
    actions.unshift({
      name: TooltipName.ActivateArtifact,
      children: (
        <Btn
          disabled={activating || !activateArtifactCooldownPassed}
          onClick={(e) => {
            e.stopPropagation();
            activate(artifact);
          }}
        >
          {activating ? (
            <LoadingSpinner initialText={"Activating..."} />
          ) : (
            "Activate"
          )}
        </Btn>
      ),
    });
  }

  if (
    artifact.status === ArtifactStatus.Charging ||
    artifact.status === ArtifactStatus.Cooldown
  ) {
    actions.unshift({
      name: TooltipName.Empty,
      extraContent: <>You must wait before proceeding to the next step</>,
      children: (
        <Sub>
          {formatDuration(
            uiManager.convertTickToMs(
              artifact.status === ArtifactStatus.Charging
                ? artifact.chargeTick + artifact.charge
                : artifact.cooldownTick + artifact.cooldown,
            ) - Date.now(),
          )}
        </Sub>
      ),
    });
  }

  if (canShutdown) {
    actions.unshift({
      name: TooltipName.ShutdownArtifact,
      children: (
        <Btn
          disabled={shuttingDown}
          onClick={(e) => {
            e.stopPropagation();
            shutdown(artifact);
          }}
        >
          {shuttingDown ? (
            <LoadingSpinner initialText={"Shutting down..."} />
          ) : (
            "Shutdown"
          )}
        </Btn>
      ),
    });
  }

  return (
    <div>
      {actions.length > 0 && <Spacer height={4} />}
      {actions.map((a, i) => (
        <span key={i}>
          <TooltipTrigger {...a} />
          <Spacer width={4} />
        </span>
      ))}

      {onPlanet &&
        artifact.artifactType === ArtifactType.ShipPink &&
        artifact.controller === account && (
          <div>
            <br />
            <div> Drop Bomb </div>
            <DropBombPane initialPlanetId={onPlanet.locationId} />
          </div>
        )}
    </div>
  );
}
