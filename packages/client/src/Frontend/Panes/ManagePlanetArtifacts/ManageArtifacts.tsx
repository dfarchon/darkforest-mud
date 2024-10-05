import type { Artifact, LocatablePlanet } from "@df/types";
import { PlanetType } from "@df/types";
import React, { useEffect, useState } from "react";
import styled, { css } from "styled-components";

import { Btn } from "../../Components/Btn";
import { Spacer } from "../../Components/CoreUI";
import type { ModalHandle } from "../../Views/ModalPane";
import { AllArtifacts } from "../ArtifactsList";

export function ManageArtifactsPane({
  planet,
  artifactsInWallet,
  artifactsOnPlanet,
  playerAddress,
  modal,
}: {
  planet: LocatablePlanet;
  artifactsInWallet: Artifact[];
  artifactsOnPlanet: Array<Artifact | undefined>;
  playerAddress: string;
  modal: ModalHandle;
}) {
  const isMyTradingPost =
    planet.owner === playerAddress &&
    planet.planetType === PlanetType.TRADING_POST &&
    !planet.destroyed &&
    !planet.frozen;
  const [viewingDepositList, setViewingDepositList] = useState(false);
  const [action, setAction] = useState(false);
  const [composingArtifactList, setComposingArtifactList] = useState<
    Artifact[]
  >([]);

  const handleSelectCompseArtifact = (a: Artifact) => {
    setAction(true);
    setComposingArtifactList((prev: Artifact[]) => [...prev, a]);
  };

  useEffect(() => {
    setViewingDepositList(false);
  }, [planet.locationId, playerAddress]);

  return (
    <>
      <AllArtifacts
        maxRarity={viewingDepositList ? planet.planetLevel - 1 : undefined}
        depositOn={viewingDepositList ? planet.locationId : undefined}
        artifacts={
          (viewingDepositList ? artifactsInWallet : artifactsOnPlanet).filter(
            (a) => !!a,
          ) as Artifact[]
        }
        handleSelectCompseArtifact={handleSelectCompseArtifact}
        modal={modal}
        noArtifactsMessage={
          <>
            No Artifacts <br /> On This Planet
          </>
        }
        noShipsMessage={
          <>
            No Ships <br /> On This Planet
          </>
        }
      />
      {action && (
        <ArtifactActionBtnContainer>
          <Btn
            disabled={false}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Compose
          </Btn>
        </ArtifactActionBtnContainer>
      )}

      <Spacer height={4} />

      {isMyTradingPost && (
        <SelectArtifactsContainer>
          <SelectArtifactList
            selected={!viewingDepositList}
            onClick={() => {
              setViewingDepositList(false);
            }}
          >
            On This Planet
          </SelectArtifactList>
          <SelectArtifactList
            selected={viewingDepositList}
            onClick={() => {
              setViewingDepositList(true);
            }}
          >
            Deposit Artifact
          </SelectArtifactList>
        </SelectArtifactsContainer>
      )}
    </>
  );
}

const SelectArtifactsContainer = styled.div`
  padding: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
`;

const SelectArtifactList = styled.span`
  ${({ selected }: { selected?: boolean }) => css`
    ${selected && "text-decoration: underline;"}
    cursor: pointer;
  `}
`;

const ArtifactActionBtnContainer = styled.span`
  padding-top: 8px;
  padding-bottom: 4px;
  display: flex;
  justify-content: right;
  align-items: right;
  flex-direction: row;
`;
