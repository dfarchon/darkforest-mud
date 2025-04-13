import { address } from "@df/serde";
import { Btn } from "@frontend/Components/Btn";
import { LoadingSpinner } from "@frontend/Components/LoadingSpinner";
import { addressToEntity } from "@frontend/Utils/Mud-Utils";
import { getComponentValue } from "@latticexyz/recs";
import { useMUD } from "@mud/MUDContext";
import { useState } from "react";
import styled from "styled-components";
import { useWalletClient } from "wagmi";

import { Green, Red, Sub } from "../Components/Text";
import { useUIManager } from "../Utils/AppHooks";

// Styled component for Currency View
const CurrencyViewContainer = styled(Sub)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export function CurrencyView() {
  const {
    network: { playerEntity },
    components: components, //{ SyncProgress },
  } = useMUD();
  const { data: walletClient } = useWalletClient();
  const mainAccount = address(walletClient.account.address);
  const { GPTTokens } = components;
  const uiManager = useUIManager();

  const currentGptCredits =
    Number(getComponentValue(GPTTokens, playerEntity)?.amount || 0) +
      Number(
        getComponentValue(GPTTokens, addressToEntity(mainAccount))?.amount || 0,
      ) || 0;

  const currentCreditPrice = 0.00001;

  const [isBuyingCredits, setIsBuyingCredits] = useState(false);

  const [buyAmount, _setBuyAmount] = useState(5);

  // Function to handle buying credits
  const buyMore = async () => {
    try {
      setIsBuyingCredits(true);
      await uiManager.buyGPTTokens(buyAmount);

      // Reload state after buying
      console.log("Credits purchased successfully");
      setIsBuyingCredits(false);
    } catch (error) {
      console.error("Error buying credits:", error);
    } finally {
      setIsBuyingCredits(false);
    }
  };

  return (
    <CurrencyViewContainer>
      <span>
        You have{" "}
        {currentGptCredits === 0 ? (
          <Red>0</Red>
        ) : (
          <Green>{currentGptCredits.toString()}</Green>
        )}{" "}
        credits
      </span>
      <span>
        for Price: <Green>{currentCreditPrice.toString()} ETH each</Green>
      </span>
      <Btn onClick={buyMore} disabled={isBuyingCredits}>
        {isBuyingCredits ? (
          <LoadingSpinner initialText="buying credits..." />
        ) : (
          <span>Buy {buyAmount} Credits</span>
        )}
      </Btn>
    </CurrencyViewContainer>
  );
}
