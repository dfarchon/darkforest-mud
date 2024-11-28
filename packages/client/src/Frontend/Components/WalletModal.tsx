import { address as toEthAddress, addressToHex } from "@df/serde";
import { Btn } from "@frontend/Components/Btn";
import { Title } from "@frontend/Components/CoreUI";
import { Modal } from "@frontend/Components/Modal";
import { Green } from "@frontend/Components/Text";
import { useBurnerBalance } from "@hooks/useBalance";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { useMUD } from "@mud/MUDContext";
import React, { useEffect, useState } from "react";
import { useWalletClient } from "wagmi";

import { WalletComponent } from "./WalletComponent";

type WalletModalProps = {
  visible?: boolean;
  onClose?: () => void;
};

export const WalletModal = ({
  visible = false,
  onClose = () => {},
}: WalletModalProps) => {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const {
    components: { Player },
    network: { playerEntity },
  } = useMUD();
  const { data: walletClient } = useWalletClient();

  const { value: burnerBalanceValue, refetch: refetchBurnerBalance } =
    useBurnerBalance();

  useEffect(() => {
    const fetchBalances = async () => {
      await refetchBurnerBalance();
    };

    fetchBalances();
  }, [refetchBurnerBalance]);

  useEffect(() => {
    const checkPlayerStatus = async () => {
      if (playerEntity && walletClient?.account) {
        const mainAccount = toEthAddress(walletClient.account.address);
        const playerKey = encodeEntity(Player.metadata.keySchema, {
          owner: addressToHex(mainAccount),
        });
        const rawPlayer = getComponentValue(Player, playerKey);
        const isRegistered = !!rawPlayer;
        const hasFunds = burnerBalanceValue > 0n;
        setIsPlayerReady(isRegistered && hasFunds);
      }
    };

    checkPlayerStatus();
    const intervalId = setInterval(checkPlayerStatus, 1000);
    return () => clearInterval(intervalId);
  }, [playerEntity, Player, walletClient, burnerBalanceValue]);

  if (!visible) {
    return null;
  } else {
    return (
      <Modal id="wallet-modal" width="50em">
        <Title slot="title">Wallet Management</Title>
        <WalletComponent showRegisterPlayer={true} />

        {isPlayerReady && (
          <div className="flex flex-col items-center gap-4 p-4">
            <Green>
              You are registered and your burner wallet has funds. You are ready
              to play!
            </Green>
            <Btn onClick={onClose}>Close</Btn>
          </div>
        )}
      </Modal>
    );
  }
};
