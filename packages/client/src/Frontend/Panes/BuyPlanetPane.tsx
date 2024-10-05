import { EMPTY_ADDRESS, TOKEN_NAME } from "@df/constants";
import { isLocatable } from "@df/gamelogic";
import { weiToEth } from "@df/network";
import { getPlanetName } from "@df/procedural";
import { isUnconfirmedBuyPlanetTx } from "@df/serde";
import { BigNumber } from "ethers";
import React from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { EmSpacer, Section, SectionHeader } from "../Components/CoreUI";
import { MythicLabelText } from "../Components/Labels/MythicLabel";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import {
  useAccount,
  // useHalfPrice,
  usePlayer,
  useSelectedPlanet,
  useUIManager,
} from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import { PlanetLink } from "../Views/PlanetLink";
import { PlanetThumb } from "./PlanetDexPane";

const BuyPlanetContent = styled.div`
  width: 500px;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  /* text-align: justify; */
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;

  justify-content: space-between;
  align-items: center;

  & > span:first-child {
    flex-grow: 1;
  }
`;

export function BuyPlanetPane(): React.ReactElement {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();

  const account = useAccount(uiManager);
  const player = usePlayer(uiManager).value;
  const selectedPlanet = useSelectedPlanet(uiManager).value;
  const balanceEth = weiToEth(
    useEmitterValue(
      uiManager.getEthConnection().myBalance$,
      BigNumber.from("0"),
    ),
  );
  // const halfPrice = useHalfPrice();

  if (!account || !player) {
    return <></>;
  }

  const getPlanetCostEth = () => {
    const res = 0.003 * 2 ** player.buyPlanetAmount;
    // if (halfPrice) {
    //   res *= 0.5;
    // }
    return res;
  };

  //level
  const currentPlanetLevel = selectedPlanet
    ? selectedPlanet.planetLevel
    : "n/a";
  const planetLevelCheckPassed = selectedPlanet
    ? selectedPlanet.planetLevel === 0
    : false;

  // owner
  const currentPlanetOwner = selectedPlanet ? selectedPlanet.owner : "no owner";

  // range
  const getRangeCheck = () => {
    if (!isLocatable(selectedPlanet)) {
      return false;
    }
    const planet = selectedPlanet;
    const x = planet.location.coords.x;
    const y = planet.location.coords.y;
    const radius = Math.sqrt(x ** 2 + y ** 2);

    const MAX_LEVEL_DIST = gameManager.getContractConstants().MAX_LEVEL_DIST;
    return radius > MAX_LEVEL_DIST[1];
  };
  const rangeCheckPassed = getRangeCheck();

  //amount
  const MAX_BUY_PLANET_AMOUNT = 6;
  //TODO: make a better UI
  const amountCheckPassed = player.buyPlanetAmount < MAX_BUY_PLANET_AMOUNT;

  // balance
  const balanceCheckPassed = balanceEth >= getPlanetCostEth();

  //state
  const isBuyingThisPlanetNow = !!selectedPlanet?.transactions?.hasTransaction(
    isUnconfirmedBuyPlanetTx,
  );

  const isBuyingNow =
    isBuyingThisPlanetNow ||
    !!gameManager
      .getGameObjects()
      .transactions.hasTransaction(isUnconfirmedBuyPlanetTx);

  const disableBuyButton =
    !selectedPlanet ||
    !isLocatable(selectedPlanet) ||
    !planetLevelCheckPassed ||
    selectedPlanet.owner !== EMPTY_ADDRESS ||
    !rangeCheckPassed ||
    !amountCheckPassed ||
    !balanceCheckPassed ||
    isBuyingNow;

  const buyPlanet = async () => {
    if (!selectedPlanet) {
      return;
    }
    if (!uiManager) {
      return;
    }
    if (disableBuyButton) {
      return;
    }
    uiManager.buyPlanet(selectedPlanet);
  };

  let buttonContent = <></>;

  if (!selectedPlanet) {
    buttonContent = <>No Planet Selected</>;
  } else if (!isLocatable(selectedPlanet)) {
    buttonContent = <>Planet need to be Locatable</>;
  } else if (!planetLevelCheckPassed) {
    buttonContent = <>Planet level should be 0</>;
  } else if (selectedPlanet.owner !== EMPTY_ADDRESS) {
    buttonContent = <>Planet has owner</>;
  } else if (!rangeCheckPassed) {
    buttonContent = <>Planet should on the edge of universe</>;
  } else if (!amountCheckPassed) {
    buttonContent = <>You can not buy more</>;
  } else if (!balanceCheckPassed) {
    buttonContent = <> You balance is too low</>;
  } else if (isBuyingNow) {
    buttonContent = <LoadingSpinner initialText={"Buying..."} />;
  } else {
    buttonContent = <>Buy this planet</>;
  }
  return (
    <BuyPlanetContent>
      <Section>
        <SectionHeader>Buy Planet</SectionHeader>
        {halfPrice && <MythicLabelText text={"Everything is half price !!!"} />}

        <Row>
          <span> Selected Planet</span>
          <span>
            {selectedPlanet ? (
              <span
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <PlanetThumb planet={selectedPlanet} />
                <PlanetLink planet={selectedPlanet}>
                  {getPlanetName(selectedPlanet)}
                </PlanetLink>
              </span>
            ) : (
              <span>{"(none)"}</span>
            )}
          </span>
        </Row>

        <Row>
          <span>Planet Level </span>
          <span> {currentPlanetLevel}</span>
        </Row>

        <Row>
          <span>Planet Owner </span>
          <span> {currentPlanetOwner}</span>
        </Row>

        <Row>
          <span>Cost / My Balance </span>
          <span>
            {getPlanetCostEth()} ${TOKEN_NAME} / {balanceEth} ${TOKEN_NAME}
          </span>
        </Row>

        <Row>
          <span>My Amount / Max Amount </span>
          <span>{player.buyPlanetAmount} / 6</span>
        </Row>
      </Section>

      <Btn disabled={disableBuyButton} onClick={buyPlanet}>
        {buttonContent}
      </Btn>
      <EmSpacer height={1} />
    </BuyPlanetContent>
  );
}
