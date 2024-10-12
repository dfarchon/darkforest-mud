import { FIXED_DIGIT_NUMBER, TOKEN_NAME } from "@df/constants";
import { gweiToWei, weiToEth } from "@df/network";
import { address } from "@df/serde";
import { ArtifactType, Setting } from "@df/types";
import { BigNumber } from "ethers";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import styled, { css, keyframes } from "styled-components";

import { ONE_DAY } from "../../Backend/Utils/Utils";
import Button from "../Components/Button";
import type { DarkForestCheckbox } from "../Components/Input";
import { Checkbox } from "../Components/Input";
import { Row } from "../Components/Row";
import dfstyles from "../Styles/dfstyles";
import { getSetting, setBooleanSetting } from "../Utils/SettingsHooks";

const StyledTxConfirmPopup = styled.div`
  width: 100%;
  height: 100%;

  position: absolute;
  z-index: 2;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  background: white;
  color: black;

  font-family: "Helvetica", "Arial", sans-serif;
  font-size: 12pt;

  font-weight: 400;

  .mono {
    font-family: "Inconsolata", "Monaco", monospace;
    font-size: 11pt;
  }

  b {
    font-weight: 700;
  }

  .mtop {
    margin-top: 1em;
  }

  button {
    flex-grow: 1;
    padding: 1em;
    border-radius: 8px;

    transition: filter 0.1s;
    &:hover {
      filter: brightness(1.1);
    }
    &:active {
      filter: brightness(0.9);
    }

    &:first-child {
      margin-right: 0.5em;
      background: #e3e3e3;
      border: 2px solid #444;
    }
    &:last-child {
      color: white;
      background: #00aed9;
      border: 2px solid #00708b;
    }
  }

  .network {
    color: ${dfstyles.colors.subtext};
  }

  .section {
    padding: 0.5em;

    &:not(:last-of-type) {
      border-bottom: 1px solid gray;
    }

    & > h2 {
      font-size: 1.5em;
      font-weight: 300;
    }
  }
`;

const keys = keyframes`
  from {
    filter: brightness(1.3);
  }
  to {
    filter: brightness(0.6);
  }
`;

const anim = css`
  animation: ${keys} 1s ${dfstyles.game.styles.animProps};
`;

const ConfirmIcon = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background: ${dfstyles.colors.dfgreen};

  ${anim};
`;

export function TxConfirmPopup() {
  const { contract, addr, actionId, balance, method } = useParams();

  const contractAddress = address(contract!);
  const account = address(addr!);

  const config = {
    contractAddress: contractAddress,
    account: account,
  };

  const doReject = () => {
    localStorage.setItem(`tx-approved-${account}-${actionId}`, "false");
    window.close();
  };

  const [autoApproveChecked, setAutoApprovedChecked] = useState<boolean>(false);

  const approve = () => {
    localStorage.setItem(`tx-approved-${account}-${actionId}`, "true");
    window.close();
  };

  const setAutoApproveSetting = () => {
    localStorage.setItem(`tx-approved-${account}-${actionId}`, "true");
    localStorage.setItem(
      `wallet-enabled-${account}`,
      (Date.now() + ONE_DAY).toString(),
    );
    const config = {
      contractAddress,
      account,
    };
    setBooleanSetting(config, Setting.AutoApproveNonPurchaseTransactions, true);
    window.close();
  };

  const doApprove = () => {
    if (autoApproveChecked) {
      setAutoApproveSetting();
    } else {
      approve();
    }
  };

  // public getGasFeeForTransaction(tx: Transaction): AutoGasSetting | string {
  //   if (
  //     (tx.intent.methodName === 'initializePlayer' || tx.intent.methodName === 'giveSpaceShips') &&
  //     tx.intent.contract.address === this.contract.address
  //   ) {
  //     return '50';
  //   }
  //   const config = {
  //     contractAddress: this.contractAddress,
  //     account: this.ethConnection.getAddress(),
  //   };
  //   return getSetting(config, Setting.GasFeeGwei);
  // }
  // ethConnection.getAutoGasPriceGwei(ethConnection.getAutoGasPrices(), autoGasPriceSetting);

  const wrapGasFee = () => {
    if (method === "df__initializePlayer" || method === "giveSpaceShips") {
      const settingValue = getSetting(config, Setting.GasFeeGwei);
      return Number(parseFloat(settingValue) * parseInt("10"))
        .toFixed(FIXED_DIGIT_NUMBER)
        .toString();
    }

    const res = getSetting(config, Setting.GasFeeGwei);

    return res;
  };
  const gasFeeGwei = wrapGasFee();

  const gasLimit = getSetting(config, Setting.GasFeeLimit);

  const fromPlanet = localStorage.getItem(`${account}-fromPlanet`);
  const toPlanet = localStorage.getItem(`${account}-toPlanet`);
  const halfPrice = localStorage.getItem(`${account}-halfPrice`);

  const hatPlanet = localStorage.getItem(`${account}-hatPlanet`);
  const hatLevel = localStorage.getItem(`${account}-hatLevel`);
  const hatCostEth = localStorage.getItem(`${account}-hatCostEth`);
  const hatCost: number =
    method === "buySkin" && hatLevel && hatCostEth ? Number(hatCostEth) : 0;
  // const hatCost: number = method === 'buySkin' && hatLevel ? 2 **
  // parseInt(hatLevel) : 0;

  const upPlanet = localStorage.getItem(`${account}-upPlanet`);
  const branch = localStorage.getItem(`${account}-branch`);

  const planetToTransfer = localStorage.getItem(`${account}-transferPlanet`);
  const transferTo = localStorage.getItem(`${account}-transferOwner`);

  const findArtifactPlanet = localStorage.getItem(
    `${account}-findArtifactOnPlanet`,
  );

  const depositPlanet = localStorage.getItem(`${account}-depositPlanet`);
  const depositArtifact = localStorage.getItem(`${account}-depositArtifact`);

  const withdrawPlanet = localStorage.getItem(`${account}-withdrawPlanet`);
  const withdrawArtifact = localStorage.getItem(`${account}-withdrawArtifact`);

  const activatePlanet = localStorage.getItem(`${account}-activatePlanet`);
  const activateArtifact = localStorage.getItem(`${account}-activateArtifact`);

  const deactivatePlanet = localStorage.getItem(`${account}-deactivatePlanet`);
  const deactivateArtifact = localStorage.getItem(
    `${account}-deactivateArtifact`,
  );

  const withdrawSilverPlanet = localStorage.getItem(
    `${account}-withdrawSilverPlanet`,
  );

  const buyArtifactOnPlanet = localStorage.getItem(
    `${account}-buyArtifactOnPlanet`,
  );
  const butArtifactType = localStorage.getItem(`${account}-buyArtifactType`);

  const buyArtifactRarity = localStorage.getItem(
    `${account}-buyArtifactRarity`,
  );

  //buyPlanet
  const buyPlanet = localStorage.getItem(`${account}-buyPlanet`);
  const planetCostEth = localStorage.getItem(`${account}-planetCostEth`);
  const buyPlanetCost =
    method === "buyPlanet" && planetCostEth ? Number(planetCostEth) : 0; //0.001 eth

  //buySpaceship
  const buySpaceshipOnPlanetId = localStorage.getItem(
    `${account}-buySpaceshipOnPlanetId`,
  );
  const buySpaceshipCost =
    method === "buySpaceship"
      ? halfPrice && halfPrice === "true"
        ? 0.0005
        : 0.001
      : 0; // 0.001 eth

  //donate
  const rawDonateAmount = localStorage.getItem(`${account}-donateAmount`);

  const donationAmount =
    method === "donate" ? Number(rawDonateAmount) * 0.001 : 0;

  // function isTypeOK() {
  //     if (butArtifactType === undefined) return false;
  //     const val = Number(butArtifactType);
  //     if (val === Number(ArtifactType.Wormhole)) return true;
  //     if (val === Number(ArtifactType.PlanetaryShield)) return true;
  //     if (val === Number(ArtifactType.BloomFilter)) return true;
  //     if (val === Number(ArtifactType.FireLink)) return true;
  //     if (val === Number(ArtifactType.StellarShield)) return true;
  //     if (val === Number(ArtifactType.Avatar)) return true;

  //     return false;
  // }

  function price() {
    if (halfPrice) {
      return 0.0005;
    } else {
      return 0.001; // 0.001 eth
    }
    // return 50;
    // console.warn('this is price');
    // console.log(butArtifactType);
    // console.log(buyArtifactRarity);

    // if (butArtifactType === undefined) return 0;
    // if (buyArtifactRarity === undefined) return 0;
    // if (isTypeOK() === false) return 0;

    // const rarityVal = Number(buyArtifactRarity);
    // const typeVal = Number(butArtifactType);

    // if (rarityVal === 0 || rarityVal >= 5) return 0;

    // if (
    //     typeVal === Number(ArtifactType.Wormhole) ||
    //     typeVal === Number(ArtifactType.PlanetaryShield) ||
    //     typeVal === Number(ArtifactType.BloomFilter) ||
    //     typeVal === Number(ArtifactType.FireLink)
    // ) {
    //     return 2 ** (parseInt(rarityVal.toString()) - 1);
    // } else if (typeVal === Number(ArtifactType.Avatar)) {
    //     return 1;
    // } else if (typeVal === Number(ArtifactType.StellarShield)) {
    //     return 8;
    // } else return 0;
  }

  const buyArtifactCost: number =
    method === "buyArtifact" && buyArtifactRarity && butArtifactType
      ? price()
      : 0;

  const entryFee = localStorage.getItem(`${account}-entryFee`);

  const joinGameCost: number =
    method === "df__initializePlayer" && entryFee
      ? weiToEth(BigNumber.from(entryFee))
      : 0;

  const getTxCost = () => {
    if (!isNaN(Number(gasFeeGwei))) {
      // console.log('first');
      // console.log(Number(gasLimit));
      // console.log(Number(gasFeeGwei));
      // console.log(gweiToWei(Number(gasLimit) * Number(gasFeeGwei)));
      // console.log(weiToEth(gweiToWei(Number(gasLimit) * Number(gasFeeGwei))));

      const res: number =
        hatCost +
        buyArtifactCost +
        joinGameCost +
        buyPlanetCost +
        buySpaceshipCost +
        donationAmount +
        weiToEth(gweiToWei(Number(gasLimit) * Number(gasFeeGwei)));

      return res.toFixed(18).toString();
    } else {
      // console.log('second');
      // console.log(Number(gasLimit));
      // console.log(Number(gasFeeGwei));
      // console.log(gweiToWei(Number(gasLimit) * Number(gasFeeGwei)));
      // console.log(weiToEth(gweiToWei(Number(gasLimit) * Number(gasFeeGwei))));

      const pre = "Estimated: ";
      let val = "0";
      if (gasFeeGwei === "Slow") {
        val = "1";
      } else if (gasFeeGwei === "Average") {
        val = "3";
      } else if (gasFeeGwei === "Fast") {
        val = "10";
      } else {
        val = gasFeeGwei;
      }

      const res: number =
        hatCost +
        buyArtifactCost +
        joinGameCost +
        buyPlanetCost +
        buySpaceshipCost +
        donationAmount +
        weiToEth(gweiToWei(Number(gasLimit) * Number(val)));

      return pre + res.toFixed(18).toString();
    }
  };

  const txCost: string = getTxCost();

  const revealPlanet = localStorage.getItem(`${account}-revealLocationId`);

  return (
    <StyledTxConfirmPopup>
      <div className="section">
        <h2> NOTICE </h2>

        <div>
          <b>The estimate here does not include the L1 gas fee.</b>
        </div>
        <div>
          <b>The estimate here does not include paid operations in plugins.</b>
        </div>
        <div>
          {" "}
          <b>Please check the blockchain explorer to know more.</b>
        </div>
      </div>
      <div className="section">
        <h2>Confirm Transaction</h2>
      </div>

      <div className="section">
        <Row>
          <b>Contract Action</b>
          <span>{method.toUpperCase()}</span>
        </Row>
        {method === "revealLocation" && (
          <Row>
            <b>Planet ID</b>
            <span className="mono">{revealPlanet}</span>
          </Row>
        )}

        {method === "buySkin" && (
          <>
            <Row>
              <b>On</b>
              <span className="mono">{hatPlanet}</span>
            </Row>
            <Row>
              <b>HAT Level</b>
              <span>{hatLevel}</span>
            </Row>

            <Row>
              <b>Half Price</b>
              <span>{halfPrice ? halfPrice : "false"}</span>
            </Row>

            <Row>
              <b>Hat Fee </b>
              <span>
                {hatCost} ${TOKEN_NAME}
              </span>
            </Row>
          </>
        )}

        {method === "buyPlanet" && (
          <>
            <Row>
              <b>On</b>
              <span className="mono">{buyPlanet}</span>
            </Row>

            <Row>
              <b>Half Price</b>
              <span>{halfPrice ? halfPrice : "false"}</span>
            </Row>

            <Row>
              <b>Buy Planet Fee </b>
              <span>
                {buyPlanetCost} ${TOKEN_NAME}
              </span>
            </Row>
          </>
        )}

        {method === "buySpaceship" && (
          <>
            <Row>
              <b>On</b>
              <span className="mono">{buySpaceshipOnPlanetId}</span>
            </Row>

            <Row>
              <b>Half Price</b>
              <span>{halfPrice ? halfPrice : "false"}</span>
            </Row>

            <Row>
              <b>Buy Spaceship Fee </b>
              <span>
                {buySpaceshipCost} ${TOKEN_NAME}
              </span>
            </Row>
          </>
        )}

        {method === "donate" && (
          <>
            <Row>
              <b>Donation Amount </b>
              <span>
                {donationAmount} ${TOKEN_NAME}
              </span>
            </Row>
          </>
        )}

        {method === "move" && (
          <>
            <Row>
              <b>From</b>
              <span className="mono">{fromPlanet}</span>
            </Row>
            <Row>
              <b>To</b>
              <span className="mono">{toPlanet}</span>
            </Row>
          </>
        )}
        {method === "upgradePlanet" && (
          <>
            <Row>
              <b>On</b>
              <span className="mono">{upPlanet}</span>
            </Row>
            <Row>
              <b>Branch</b>
              <span>{branch}</span>
            </Row>
          </>
        )}
        {method === "transferPlanet" && (
          <>
            <Row>
              <b>Planet ID</b>
              <span className="mono">{planetToTransfer}</span>
            </Row>
            <Row>
              <b>Transfer to</b>
              <span>{transferTo}</span>
            </Row>
          </>
        )}
        {method === "findArtifact" && (
          <Row>
            <b>Planet ID</b>
            <span className="mono">{findArtifactPlanet}</span>
          </Row>
        )}
        {method === "depositArtifact" && (
          <>
            <Row>
              <b>Planet ID</b>
              <span className="mono">{depositPlanet}</span>
            </Row>
            <Row>
              <b>Artifact ID</b>
              <span className="mono">{depositArtifact}</span>
            </Row>
          </>
        )}
        {method === "withdrawArtifact" && (
          <>
            <Row>
              <b>Planet ID</b>
              <span className="mono">{withdrawPlanet}</span>
            </Row>
            <Row>
              <b>Artifact ID</b>
              <span className="mono">{withdrawArtifact}</span>
            </Row>
          </>
        )}
        {method === "activateArtifact" && (
          <>
            <Row>
              <b>Planet ID</b>
              <span className="mono">{activatePlanet}</span>
            </Row>
            <Row>
              <b>Artifact ID</b>
              <span className="mono">{activateArtifact}</span>
            </Row>
          </>
        )}
        {method === "deactivateArtifact" && (
          <>
            <Row>
              <b>Planet ID</b>
              <span className="mono">{deactivatePlanet}</span>
            </Row>
            <Row>
              <b>Artifact ID</b>
              <span className="mono">{deactivateArtifact}</span>
            </Row>
          </>
        )}

        {method === "buyArtifact" && (
          <>
            <Row>
              <b>Planet ID</b>
              <span className="mono">{buyArtifactOnPlanet}</span>
            </Row>
            <Row>
              <b>Half Price</b>
              <span>{halfPrice ? halfPrice : "false"}</span>
            </Row>
            <Row>
              <b>Artifact Price </b>
              <span>
                ({buyArtifactCost} ${TOKEN_NAME})
              </span>
            </Row>
          </>
        )}
        {method === "withdrawSilver" && (
          <Row>
            <b>Planet ID</b>
            <span className="mono">{withdrawSilverPlanet}</span>
          </Row>
        )}

        {method === "df__initializePlayer" && (
          <>
            <Row>
              <b>Half Price</b>
              <span>{halfPrice ? halfPrice : "false"}</span>
            </Row>

            <Row>
              <b>Entry Fee </b>
              <span>
                {joinGameCost} ${TOKEN_NAME}
              </span>
            </Row>
          </>
        )}
      </div>

      <div className="section">
        <Row>
          <b>Gas Fee</b>
          <span>{gasFeeGwei} gwei</span>
        </Row>

        <Row>
          <b>Gas Limit</b>
          <span>{gasLimit}</span>
        </Row>

        <Row>
          <b>Max Transaction Cost</b>
          <span>
            {txCost} ${TOKEN_NAME}
          </span>
        </Row>
        {method === "buySkinn" && hatLevel && +hatLevel > 6 && (
          <Row>
            <b
              style={{
                color: "red",
              }}
            >
              WARNING: You are buying a very expensive HAT! Check the price and
              make sure you intend to do this!
            </b>
          </Row>
        )}

        <Row className="mtop">
          <b>Account Balance</b>
          <span>
            {parseFloat(balance).toFixed(18)} ${TOKEN_NAME}
          </span>
        </Row>
        <Row className="mtop">
          <Button onClick={doReject}>
            <span>{"Reject"}</span>
          </Button>

          <Button onClick={doApprove}>
            <span>{"Approve"}</span>
          </Button>
        </Row>
      </div>

      <div className="section">
        <Row className="network">
          <div>
            <ConfirmIcon /> Dark Forest MUD connected to Blockchain
          </div>
        </Row>
        <Row className="mtop">
          <Checkbox
            label="Auto-confirm all transactions except purchases. Currently, you can only purchase Hats, or anything 3rd party plugins offer."
            checked={autoApproveChecked}
            onChange={(e: Event & React.ChangeEvent<DarkForestCheckbox>) =>
              setAutoApprovedChecked(e.target.checked)
            }
          />
        </Row>
      </div>
    </StyledTxConfirmPopup>
  );
}
