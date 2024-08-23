import { useCallback, useEffect, useState } from "react";

import { WalletClient } from "viem";
import { useAccount, useBalance } from "wagmi";

import { LOW_BALANCE_THRESHOLD, RECOMMENDED_BALANCE } from "../shared";

// You can define a threshold constant for low balance

export function useBurnerBalance(burnerClient: WalletClient) {
  const [balance, setBalance] = useState<bigint>(0n); // State to store the balance
  const [danger, setDanger] = useState(false); // State to track low balance danger

  const { data: balanceData, refetch } = useBalance({
    address: burnerClient?.account?.address, // Use burner account address
  });

  // Fetch balance function with refetch capability
  const fetchBalance = useCallback(async () => {
    if (balanceData) {
      const fetchedBalance = BigInt(balanceData.value);
      setBalance(fetchedBalance);
      setDanger(fetchedBalance < LOW_BALANCE_THRESHOLD); // Mark as danger if below threshold
    }
  }, [balanceData]);

  // Call refetch to re-fetch the balance
  const refetchBalance = useCallback(async () => {
    await refetch();
    fetchBalance(); // Update local state after refetch
  }, [refetch, fetchBalance]);

  return { value: balance, danger, refetch: refetchBalance }; // Return balance and danger flag with refetch function
}

export function useMainWalletBalance() {
  const { address } = useAccount(); // Get main wallet account from wagmi
  const [balance, setBalance] = useState<bigint>(0n); // State to store the balance
  const [belowRecommended, setBelowRecommended] = useState(false); // Track if balance is below recommended

  const { data: balanceData, refetch } = useBalance({
    address,
  });

  // Fetch balance function with refetch capability
  const fetchBalance = useCallback(async () => {
    if (balanceData) {
      const fetchedBalance = BigInt(balanceData.value);
      setBalance(fetchedBalance);
      setBelowRecommended(fetchedBalance < RECOMMENDED_BALANCE); // Mark as below recommended if lower
    }
  }, [balanceData]);

  // Call refetch to re-fetch the balance
  const refetchBalance = useCallback(async () => {
    await refetch();
    fetchBalance(); // Update local state after refetch
  }, [refetch, fetchBalance]);

  return { value: balance, belowRecommended, refetch: refetchBalance }; // Return balance and belowRecommended flag with refetch function
}
