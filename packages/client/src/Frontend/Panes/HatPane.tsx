import {
  HOW_TO_TRANSFER_ETH_FROM_L2_TO_REDSTONE,
  MAX_AVATAR_TYPE,
  MAX_LOGO_TYPE,
  MAX_MEME_TYPE,
  MIN_AVATAR_TYPE,
  MIN_LOGO_TYPE,
  MIN_MEME_TYPE,
  TOKEN_NAME,
} from "@df/constants";
import { weiToEth } from "@df/network";
import {
  avatarTypeToNum,
  isAvatar,
  isHat,
  isLogo,
  isMeme,
  logoTypeToNum,
  memeTypeToNum,
  numToAvatarType,
  numToHatType,
  numToLogoType,
  numToMemeType,
} from "@df/procedural";
import { isUnconfirmedBuyHatTx } from "@df/serde";
import type { AvatarType, LocationId, MemeType, Planet } from "@df/types";
import {
  AvatarTypeNames,
  HatTypeNames,
  LogoType,
  LogoTypeNames,
  MemeTypeNames,
} from "@df/types";
import { BigNumber } from "ethers";
import React, { useState } from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import {
  CenterBackgroundSubtext,
  EmSpacer,
  Link,
  SelectFrom,
} from "../Components/CoreUI";
import { MythicLabelText } from "../Components/Labels/MythicLabel";
import { Sub } from "../Components/Text";
import {
  useAccount,
  // useHalfPrice,
  usePlanet,
  useUIManager,
} from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import type { ModalHandle } from "../Views/ModalPane";

const StyledHatPane = styled.div`
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

export function HatPane({
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

  const getHatCostEth = (planet: Planet) => {
    let fee = 0.002;
    if (planet.hatLevel === 0) {
      fee = 0.002;
      // if (halfPrice) {
      //   fee *= 0.5;
      // }
    } else {
      fee = 0;
    }
    return fee;
    // return 2 ** planet.hatLevel;
  };
  const enabled = (planet: Planet): boolean =>
    !planet.transactions?.hasTransaction(isUnconfirmedBuyHatTx) &&
    planet?.owner === account &&
    balanceEth > getHatCostEth(planet);

  const defaultHatType =
    planet && planet.hatLevel > 0
      ? planet.hatType
      : logoTypeToNum(LogoType.DFARES);

  const [hatType, setHatType] = useState(defaultHatType.toString());

  const values = [];
  const labels = [];

  // for (let i = MIN_HAT_TYPE; i <= MAX_HAT_TYPE; i++) {
  //   values.push(hatTypeToNum(Number(i) as HatType).toString());
  //   labels.push(HatTypeNames[i]);
  // }

  for (let i = MIN_MEME_TYPE; i <= MAX_MEME_TYPE; i++) {
    values.push(memeTypeToNum(Number(i) as MemeType).toString());
    labels.push(MemeTypeNames[i]);
  }

  for (let i = MIN_LOGO_TYPE; i <= MAX_LOGO_TYPE; i++) {
    values.push(logoTypeToNum(Number(i) as LogoType).toString());
    labels.push(LogoTypeNames[i]);
  }

  for (let i = MIN_AVATAR_TYPE; i <= MAX_AVATAR_TYPE; i++) {
    values.push(avatarTypeToNum(Number(i) as AvatarType).toString());
    labels.push(AvatarTypeNames[i]);
  }

  const getSkinTypeName = (hatType: number): string => {
    if (isHat(hatType)) {
      return HatTypeNames[numToHatType(hatType)];
    } else if (isMeme(hatType)) {
      return MemeTypeNames[numToMemeType(hatType)];
    } else if (isLogo(hatType)) {
      return LogoTypeNames[numToLogoType(hatType)];
    } else if (isAvatar(hatType)) {
      return AvatarTypeNames[numToAvatarType(hatType)];
    }
    return "Let's wear Skin 🌍";
  };

  if (planet && planet.owner === account) {
    return (
      <StyledHatPane>
        {halfPrice && <MythicLabelText text={"Everything is half price !!!"} />}
        <div>
          <Sub>Skin Type</Sub>
          {/* <span>{getPlanetCosmetic(planet).hatType}</span> */}
          <span> {getSkinTypeName(planet.hatType)}</span>
        </div>

        {/* <div>
          <Sub>HAT Level</Sub>
          <span>{getHatSizeName(planet)}</span>
        </div> */}
        <div className="margin-top">
          {/* <Sub>Next Level HAT Cost</Sub> */}
          <Sub>
            {planet && planet.hatLevel > 0 ? "Take Off" : "Buy"} Skin Cost
          </Sub>
          <span>
            {getHatCostEth(planet)} ${TOKEN_NAME}
          </span>
        </div>
        <div>
          <Sub>Current Balance</Sub>
          <span>
            {balanceEth} ${TOKEN_NAME}
          </span>
        </div>

        <EmSpacer height={1} />

        <div>
          <Link to={HOW_TO_TRANSFER_ETH_FROM_L2_TO_REDSTONE}>
            Guide: How to Get More ETH on {BLOCKCHAIN_NAME}
          </Link>
        </div>

        {/* <Link to={'https://blog.zkga.me/df-04-faq'}>Get More ${TOKEN_NAME}</Link> */}

        <EmSpacer height={0.5} />

        <div>
          <div>Skin Type</div>
          <SelectFrom
            values={values}
            labels={labels}
            value={hatType.toString()}
            setValue={setHatType}
          />
        </div>

        <Btn
          onClick={() => {
            if (!enabled(planet) || !uiManager || !planet) {
              return;
            }
            uiManager.buySkin(planet, Number(hatType));
          }}
          disabled={!enabled(planet)}
        >
          {planet && planet.hatLevel > 0 ? "Take Off" : "Buy"} Skin
        </Btn>
      </StyledHatPane>
    );
  } else {
    return (
      <CenterBackgroundSubtext width="100%" height="75px">
        Select a Planet <br /> You Own
      </CenterBackgroundSubtext>
    );
  }
}
