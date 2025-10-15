import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { utils } from "ethers";
import { BigNumber } from "ethers";
import { weiToEth } from "@df/network";
import { useUIManager } from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import { Btn } from "../Components/Btn";
import { Green, Red, Text } from "../Components/Text";
import { Spacer } from "../Components/CoreUI";
import dfstyles from "../Styles/dfstyles";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: ${dfstyles.colors.background};
  border: 1px solid ${dfstyles.colors.border};
  border-radius: 8px;
  margin: 8px 0;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const Label = styled.span`
  font-weight: 500;
  color: ${dfstyles.colors.text};
`;

const Value = styled.span`
  color: ${dfstyles.colors.text};
  font-family: monospace;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Slider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: ${dfstyles.colors.border};
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${dfstyles.colors.dfblue};
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${dfstyles.colors.dfblue};
    cursor: pointer;
    border: none;
  }
`;

const NumberInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${dfstyles.colors.border};
  border-radius: 4px;
  background: ${dfstyles.colors.background};
  color: ${dfstyles.colors.text};
  font-family: monospace;
  width: 120px;

  &:focus {
    outline: none;
    border-color: ${dfstyles.colors.dfblue};
  }
`;

const InfoBox = styled.div`
  background: ${dfstyles.colors.backgrounddark};
  border: 1px solid ${dfstyles.colors.border};
  border-radius: 4px;
  padding: 12px;
  font-size: 0.9em;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

export function BuyJunkPane(): React.ReactElement {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();
  const account = gameManager.getAccount();

  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  // Get current player data
  const playerJunkLimit = gameManager.getPlayerSpaceJunkLimit(account);
  const currentLimit = playerJunkLimit ? Math.round(playerJunkLimit) : 0;
  const lowerBound = currentLimit;
  const upperBound = 500 * 500;

  // Get balance
  const balanceEth = weiToEth(
    useEmitterValue(
      uiManager.getEthConnection().myBalance$,
      BigNumber.from("0"),
    ),
  );

  // Calculate fees and costs
  const buyJunkFee =
    gameManager.getBuyJunkFee(Math.round(amount / 1000)) -
    gameManager.getBuyJunkFee(Math.round(lowerBound / 1000));
  const buyJunkFeeEth = Number(utils.formatEther(buyJunkFee));
  const balanceCheckPassed = balanceEth >= buyJunkFeeEth;

  // Calculate space junk amounts
  const currentSpaceJunk = account
    ? gameManager.getPlayerSpaceJunk(account) || 0
    : 0;
  const newSpaceJunkLimit = amount;
  const spaceJunkIncrease = newSpaceJunkLimit - (playerJunkLimit || 0);

  // Initialize amount to current limit
  useEffect(() => {
    setAmount(lowerBound);
  }, [lowerBound]);

  const handleAmountChange = (newAmount: number) => {
    const clampedAmount = Math.max(lowerBound, Math.min(upperBound, newAmount));
    setAmount(clampedAmount);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseInt(e.target.value);
    handleAmountChange(newAmount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseInt(e.target.value) || 0;
    handleAmountChange(newAmount);
  };

  const buyJunk = async () => {
    if (!balanceCheckPassed || amount <= lowerBound) {
      return;
    }

    setIsLoading(true);
    setTxStatus("idle");

    try {
      await gameManager.buyJunk(amount);
      setTxStatus("success");
      setTimeout(() => setTxStatus("idle"), 3000);
    } catch (error) {
      console.error("Error buying space junk:", error);
      setTxStatus("error");
      setTimeout(() => setTxStatus("idle"), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const canBuy = balanceCheckPassed && amount > lowerBound && !isLoading;

  return (
    <Container>
      <h3 style={{ margin: "0 0 12px 0", color: dfstyles.colors.text }}>
        Buy Space Junk Capacity
      </h3>

      <InfoBox>
        <div style={{ marginBottom: "8px" }}>
          <strong>Current Status:</strong>
        </div>
        <Row>
          <Label>Current Space Junk:</Label>
          <Value>{currentSpaceJunk.toLocaleString()}</Value>
        </Row>
        <Row>
          <Label>Current Limit:</Label>
          <Value>{currentLimit.toLocaleString()}</Value>
        </Row>
        <Row>
          <Label>Available Balance:</Label>
          <Value>{balanceEth.toFixed(4)} ETH</Value>
        </Row>
      </InfoBox>

      <InputContainer>
        <Label>New Space Junk Limit:</Label>
        <SliderContainer>
          <Slider
            type="range"
            min={lowerBound}
            max={upperBound}
            value={amount}
            onChange={handleSliderChange}
            step="1000"
          />
          <Row>
            <NumberInput
              type="number"
              value={amount}
              onChange={handleInputChange}
              min={lowerBound}
              max={upperBound}
              step="1000"
            />
            <span style={{ color: dfstyles.colors.subtext }}>
              (Range: {lowerBound} - {upperBound})
            </span>
          </Row>
        </SliderContainer>
      </InputContainer>

      <InfoBox>
        <div style={{ marginBottom: "8px" }}>
          <strong>Purchase Details:</strong>
        </div>
        <Row>
          <Label>Space Junk Increase:</Label>
          <Value>+{spaceJunkIncrease.toLocaleString()}</Value>
        </Row>
        <Row>
          <Label>New Total Limit:</Label>
          <Value>{newSpaceJunkLimit.toLocaleString()}</Value>
        </Row>
        <Row>
          <Label>Cost:</Label>
          <Value
            style={{
              color: dfstyles.colors.dfgreen,
            }}
          >
            {buyJunkFeeEth > 0 ? `${buyJunkFeeEth.toFixed(6)} ETH` : "FREE"}
          </Value>
        </Row>
        {!balanceCheckPassed && buyJunkFeeEth > 0 && (
          <Row>
            <Red>Insufficient balance for this purchase</Red>
          </Row>
        )}
      </InfoBox>

      <ButtonContainer>
        <Btn
          onClick={buyJunk}
          disabled={!canBuy}
          style={{
            opacity: canBuy ? 1 : 0.5,
            cursor: canBuy ? "pointer" : "not-allowed",
          }}
        >
          {isLoading
            ? "Processing..."
            : `Buy ${spaceJunkIncrease.toLocaleString()} Space Junk`}
        </Btn>
      </ButtonContainer>

      {txStatus === "success" && (
        <Green>✅ Space junk capacity purchased successfully!</Green>
      )}
      {txStatus === "error" && (
        <Red>❌ Transaction failed. Please try again.</Red>
      )}

      <div
        style={{
          fontSize: "0.8em",
          color: dfstyles.colors.subtext,
          marginTop: "8px",
        }}
      >
        <strong>Note:</strong> Space junk capacity determines how much space
        junk you can carry. Higher capacity allows you to own more planets.
      </div>
    </Container>
  );
}
