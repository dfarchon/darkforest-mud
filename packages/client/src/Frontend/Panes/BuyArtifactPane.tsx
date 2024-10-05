import { TOKEN_NAME } from "@df/constants";
import { weiToEth } from "@df/network";
import { isUnconfirmedBuyArtifactTx } from "@df/serde";
import type { LocationId, Planet } from "@df/types";
import { ArtifactRarity, ArtifactType, Biome } from "@df/types";
import { BigNumber } from "ethers";
import React, { useState } from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { CenterBackgroundSubtext } from "../Components/CoreUI";
import { MythicLabelText } from "../Components/Labels/MythicLabel";
import { Blue, Sub, White } from "../Components/Text";
import { formatDuration, TimeUntil } from "../Components/TimeUntil";
import {
  useAccount,
  // useHalfPrice,
  usePlanet,
  useUIManager,
} from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import type { ModalHandle } from "../Views/ModalPane";

const StyledBuyArtifactPane = styled.div`
  & > div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    &:last-child > span {
      margin-top: 1em;
      text-align: center;
      flex-grow: 1;
    }

    &.margin-top {
      margin-top: 0.5em;
    }
  }
`;

export function BuyArtifactPane({
  initialPlanetId,
  modal: _modal,
}: {
  modal: ModalHandle;
  initialPlanetId?: LocationId;
}) {
  const uiManager = useUIManager();
  const account = useAccount(uiManager);
  const planetId = useEmitterValue(
    uiManager.selectedPlanetId$,
    initialPlanetId,
  );
  const planetWrapper = usePlanet(uiManager, planetId);
  const planet = planetWrapper.value;
  const balanceEth = weiToEth(
    useEmitterValue(
      uiManager.getEthConnection().myBalance$,
      BigNumber.from("0"),
    ),
  );

  // const halfPrice = useHalfPrice();

  // const currentBlockNumber = useEmitterValue(uiManager.getEthConnection().blockNumber$, undefined);

  // //buyartifact
  // //myTodo: 60 min 1 artifact
  // const deltaTime = 60;

  // const maxAmount = currentBlockNumber
  //   ? Math.floor(
  //       ((currentBlockNumber - uiManager.contractConstants.GAME_START_BLOCK) * 2.0) /
  //         (60 * deltaTime)
  //     )
  //   : 0;

  // const buyArtifactAmountInContract = account ? uiManager.getPlayerBuyArtifactAmount(account) : 0;

  // const buyArtifactAmount = buyArtifactAmountInContract ? buyArtifactAmountInContract : 0;

  const [biome, setBiome] = useState(Biome.GRASSLAND.toString());
  const [type, setType] = useState(ArtifactType.Wormhole.toString());
  const [rarity, setRarity] = useState(ArtifactRarity.Legendary.toString());

  function isTypeOK() {
    return true;
    const val = Number(type);
    if (val === Number(ArtifactType.Wormhole)) {
      return true;
    }
    if (val === Number(ArtifactType.PlanetaryShield)) {
      return true;
    }
    if (val === Number(ArtifactType.BloomFilter)) {
      return true;
    }
    if (val === Number(ArtifactType.FireLink)) {
      return true;
    }
    if (val === Number(ArtifactType.StellarShield)) {
      return true;
    }
    if (val === Number(ArtifactType.Avatar)) {
      return true;
    }
    return false;
  }

  function getCost() {
    // if (halfPrice) {
    //   return 0.0005;
    // }
    return 0.001; //0.001 eth
    return 50;
    const rarityVal = parseInt(rarity);
    const typeVal = parseInt(type);

    if (rarityVal === 0 || rarityVal >= 5) {
      return 0;
    }
    if (isTypeOK() === false) {
      return 0;
    }
    if (
      typeVal === Number(ArtifactType.Wormhole) ||
      typeVal === Number(ArtifactType.PlanetaryShield) ||
      typeVal === Number(ArtifactType.BloomFilter) ||
      typeVal === Number(ArtifactType.FireLink)
    ) {
      return 2 ** (parseInt(rarity) - 1);
    } else if (typeVal === Number(ArtifactType.Avatar)) {
      return 1;
    } else if (typeVal === Number(ArtifactType.StellarShield)) {
      return 8;
    } else {
      return 0;
    }
  }

  const cost: number = getCost();

  // const getHatCostEth = (planet: Planet) => {
  //   return 2 ** planet.hatLevel;
  // };

  const buyArtifactCooldownPassed =
    uiManager.getNextBuyArtifactAvailableTimestamp() <= Date.now();

  const enabled = (planet: Planet): boolean =>
    !planet.transactions?.hasTransaction(isUnconfirmedBuyArtifactTx) &&
    planet?.owner === account &&
    cost > 0 &&
    balanceEth >= cost &&
    // maxAmount > buyArtifactAmount &&
    buyArtifactCooldownPassed;

  if (planet && planet.owner === account) {
    return (
      <>
        <div>
          You can buy artifact once every{" "}
          <White>
            {formatDuration(
              uiManager.contractConstants.BUY_ARTIFACT_COOLDOWN * 1000,
            )}
          </White>
          .
        </div>

        {!buyArtifactCooldownPassed && (
          <p>
            <Blue>INFO:</Blue> You must wait{" "}
            <TimeUntil
              timestamp={uiManager.getNextBuyArtifactAvailableTimestamp()}
              ifPassed={"now!"}
            />{" "}
            to buy more.
          </p>
        )}

        <StyledBuyArtifactPane>
          {halfPrice && (
            <MythicLabelText text={"Everything is half price !!!"} />
          )}
          {/* <div>block number: {currentBlockNumber}</div>
        <div> buy artifact amount {buyArtifactAmount}</div>
        <div> max artifact amount {maxAmount} </div> */}
          <div>
            <Sub>Artifact Price</Sub>
            <span>
              {cost} ${TOKEN_NAME}
            </span>
          </div>
          {/*  <div>
          <div>Biome</div>
          <SelectFrom
            values={[
              Biome.OCEAN.toString(),
              Biome.FOREST.toString(),
              Biome.GRASSLAND.toString(),
              Biome.TUNDRA.toString(),
              Biome.SWAMP.toString(),
              Biome.DESERT.toString(),
              Biome.ICE.toString(),
              Biome.WASTELAND.toString(),
              Biome.LAVA.toString(),
              Biome.CORRUPTED.toString(),
            ]}
            labels={[
              'Ocean',
              'Forest',
              'Grassland',
              'Tundra',
              'Swamp',
              'Desert',
              'Ice',
              'Wasteland',
              'Lava',
              'Corrupted',
            ]}
            value={biome.toString()}
            setValue={setBiome}
          />
        </div>

        <div>
          <div>Rarity</div>

          <SelectFrom
            values={[
              ArtifactRarity.Common.toString(),
              ArtifactRarity.Rare.toString(),
              ArtifactRarity.Epic.toString(),
              ArtifactRarity.Legendary.toString(),
            ]}
            labels={['Common', 'Rare', 'Epic', 'Legendary']}
            value={rarity.toString()}
            setValue={setRarity}
          />
        </div>

        <div>
          <div>Type</div>

          <SelectFrom
            values={[
              ArtifactType.Wormhole.toString(),
              ArtifactType.PlanetaryShield.toString(),
              ArtifactType.BloomFilter.toString(),
              ArtifactType.FireLink.toString(),
              ArtifactType.StellarShield.toString(),
              ArtifactType.Avatar.toString(),
            ]}
            labels={[
              'Wormhole',
              'PlanetaryShield',
              'BloomFilter',
              'FireLink',
              'StellarShield',
              'Avatar',
            ]}
            value={type.toString()}
            setValue={setType}
          />
        </div> */}

          <div>
            <Sub>Current Balance</Sub>
            <span>
              {balanceEth} ${TOKEN_NAME}
            </span>
          </div>
          <div>
            <Btn
              onClick={() => {
                if (!enabled(planet) || !uiManager || !planet) {
                  return;
                }
                uiManager.buyArtifact(
                  planet.locationId,
                  parseInt(rarity) as ArtifactRarity,
                  parseInt(biome) as Biome,
                  parseInt(type) as ArtifactType,
                );
              }}
              disabled={!enabled(planet)}
            >
              Buy Artifact
            </Btn>
          </div>
        </StyledBuyArtifactPane>
      </>
    );
  } else {
    return (
      <CenterBackgroundSubtext width="100%" height="75px">
        Select a Planet <br /> You Own
      </CenterBackgroundSubtext>
    );
  }
}
