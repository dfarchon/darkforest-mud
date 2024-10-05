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
  isUnconfirmedDeactivateArtifactTx,
  isUnconfirmedDepositArtifactTx,
  isUnconfirmedWithdrawArtifactTx,
} from "@df/serde";
import type { Artifact, ArtifactId, LocationId } from "@df/types";
import { ArtifactType, TooltipName } from "@df/types";
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

  const withdraw = useCallback(
    (artifact: Artifact) => {
      onPlanet && uiManager.withdrawArtifact(onPlanet.locationId, artifact?.id);
    },
    [onPlanet, uiManager],
  );

  const deposit = useCallback(
    (artifact: Artifact) => {
      artifact &&
        depositPlanetWrapper.value &&
        uiManager.depositArtifact(
          depositPlanetWrapper.value.locationId,
          artifact?.id,
        );
    },
    [uiManager, depositPlanetWrapper.value],
  );

  const activate = useCallback(
    async (artifact: Artifact) => {
      if (onPlanet && isLocatable(onPlanet)) {
        let targetPlanetId = undefined;

        if (
          artifact.artifactType === ArtifactType.Wormhole ||
          // artifact.artifactType === ArtifactType.BlackDomain ||
          // artifact.artifactType === ArtifactType.Kardashev ||
          artifact.artifactType === ArtifactType.IceLink ||
          artifact.artifactType === ArtifactType.FireLink
          // || artifact.artifactType === ArtifactType.Bomb
        ) {
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

  if (!artifact || (!onPlanet && !depositPlanet) || !account) {
    return null;
  }

  const actions: TooltipTriggerProps[] = [];

  const withdrawing = artifact.transactions?.hasTransaction(
    isUnconfirmedWithdrawArtifactTx,
  );
  const depositing = artifact.transactions?.hasTransaction(
    isUnconfirmedDepositArtifactTx,
  );
  const activating = artifact.transactions?.hasTransaction(
    isUnconfirmedActivateArtifactTx,
  );
  const deactivating = artifact.transactions?.hasTransaction(
    isUnconfirmedDeactivateArtifactTx,
  );

  const canHandleDeposit =
    depositPlanetWrapper.value &&
    depositPlanetWrapper.value.planetLevel > artifact.rarity;
  const canHandleWithdraw =
    onPlanetWrapper.value &&
    onPlanetWrapper.value.planetLevel > artifact.rarity;

  const wait = durationUntilArtifactAvailable(artifact);

  if (canDepositArtifact(account, artifact, depositPlanetWrapper.value)) {
    actions.unshift({
      name: TooltipName.DepositArtifact,
      extraContent: !canHandleDeposit && (
        <>
          . <ArtifactRarityLabelAnim rarity={artifact.rarity} />
          {` artifacts can only be deposited on level ${artifact.rarity + 1}+ spacetime rips`}
        </>
      ),
      children: (
        <Btn
          disabled={depositing}
          onClick={(e) => {
            e.stopPropagation();
            canHandleDeposit && deposit(artifact);
          }}
        >
          {depositing ? (
            <LoadingSpinner initialText={"Depositing..."} />
          ) : (
            "Deposit"
          )}
        </Btn>
      ),
    });
  }
  if (
    isActivated(artifact) &&
    artifact.artifactType !== ArtifactType.BlackDomain
  ) {
    actions.unshift({
      name: TooltipName.DeactivateArtifact,
      children: (
        <Btn
          disabled={deactivating}
          onClick={(e) => {
            e.stopPropagation();
            deactivate(artifact);
          }}
        >
          {deactivating ? (
            <LoadingSpinner initialText={"Deactivating..."} />
          ) : (
            "Deactivate"
          )}
        </Btn>
      ),
    });
  }
  if (canWithdrawArtifact(account, artifact, onPlanet)) {
    actions.unshift({
      name: TooltipName.WithdrawArtifact,
      extraContent: !canHandleWithdraw && (
        <>
          . <ArtifactRarityLabelAnim rarity={artifact.rarity} />
          {` artifacts can only be withdrawn from level ${artifact.rarity + 1}+ spacetime rips`}
        </>
      ),
      children: (
        <Btn
          disabled={withdrawing}
          onClick={(e) => {
            e.stopPropagation();
            canHandleWithdraw && withdraw(artifact);
          }}
        >
          {withdrawing ? (
            <LoadingSpinner initialText={"Withdrawing..."} />
          ) : (
            "Withdraw"
          )}
        </Btn>
      ),
    });
  }

  const activateArtifactCooldownPassed = true; // uiManager.getNextActivateArtifactAvailableTimestamp() <= Date.now();

  // if (
  //   canActivateArtifact(artifact, onPlanet, otherArtifactsOnPlanet) &&
  //   ((artifact.artifactType !== ArtifactType.Avatar && maxAmount > activateArtifactAmount) ||
  //     artifact.artifactType === ArtifactType.Avatar)
  // )

  if (canActivateArtifact(artifact, onPlanet, otherArtifactsOnPlanet)) {
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

  if (wait > 0) {
    actions.unshift({
      name: TooltipName.Empty,
      extraContent: <>You have to wait before activating an artifact again</>,
      children: <Sub>{formatDuration(wait)}</Sub>,
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
