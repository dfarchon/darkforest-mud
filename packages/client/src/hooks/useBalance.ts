import { useCallback, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { useMUD } from "../mud/MUDContext";
import { formatEther } from "viem";
import {
  LOW_BALANCE_THRESHOLD,
  MINIMUM_BALANCE,
  RECOMMENDED_BALANCE,
  zeroAddress,
} from "@wallet/utils";

// You can define a threshold constant for low balance

export function useBurnerBalance() {
  const {
    network: { walletClient },
  } = useMUD();

  const [balance, setBalance] = useState<bigint>(0n);
  const [unplayable, setUnplayeable] = useState(false);
  const [danger, setDanger] = useState(false);
  const [belowRecommended, setBelowRecommended] = useState(false);

  const { data: balanceData, refetch } = useBalance({
    address: walletClient?.account?.address ?? zeroAddress,
  });

  // Fetch balance function with refetch capability
  const fetchBalance = useCallback(async () => {
    if (balanceData) {
      const fetchedBalance = BigInt(balanceData.value.toString());
      setBalance(fetchedBalance);
      setUnplayeable(fetchedBalance < MINIMUM_BALANCE);
      setDanger(fetchedBalance < LOW_BALANCE_THRESHOLD);
      setBelowRecommended(fetchedBalance < RECOMMENDED_BALANCE);
    }
  }, [balanceData]);

  // Call refetch to re-fetch the balance
  const refetchBalance = useCallback(async () => {
    await refetch();
    fetchBalance(); // Update local state after refetch
  }, [refetch, fetchBalance]);

  return {
    value: balance,
    formatted: parseFloat(formatEther(balance)).toFixed(6),
    unplayable,
    danger,
    belowRecommended,
    refetch: refetchBalance,
  };
}

export function useMainWalletBalance() {
  const { address } = useAccount(); // Get main wallet account from wagmi
  const [balance, setBalance] = useState<bigint>(0n);
  const [unplayable, setUnplayeable] = useState(false);
  const [danger, setDanger] = useState(false);
  const [belowRecommended, setBelowRecommended] = useState(false);

  const { data: balanceData, refetch } = useBalance({
    address,
  });

  // Fetch balance function with refetch capability
  const fetchBalance = useCallback(async () => {
    if (balanceData) {
      const fetchedBalance = BigInt(balanceData.value.toString());
      setBalance(fetchedBalance);
      setUnplayeable(fetchedBalance < MINIMUM_BALANCE);
      setDanger(fetchedBalance < LOW_BALANCE_THRESHOLD);
      setBelowRecommended(fetchedBalance < RECOMMENDED_BALANCE);
    }
  }, [balanceData]);

  // Call refetch to re-fetch the balance
  const refetchBalance = useCallback(async () => {
    await refetch();
    fetchBalance();
  }, [refetch, fetchBalance]);

  return {
    value: balance,
    formatted: parseFloat(formatEther(balance)).toFixed(6),
    unplayable,
    danger,
    belowRecommended,
    refetch: refetchBalance,
  };
}
