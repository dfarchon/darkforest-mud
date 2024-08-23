import { useEffect, useState } from "react";

import { WalletClient } from "viem";
import { useAccount, useBalance } from "wagmi";

import { LOW_BALANCE_THRESHOLD, RECOMMENDED_BALANCE } from "../shared";

// You can define a threshold constant for low balance

export function useBurnerBalance(burnerClient: WalletClient) {
  const [balance, setBalance] = useState<bigint>(0n); // State to store the balance
  const [danger, setDanger] = useState(false); // State to track low balance danger

  const { data: balanceData } = useBalance({
    address: burnerClient?.account?.address, // Use burner account address
  });

  useEffect(() => {
    if (balanceData) {
      const fetchedBalance = BigInt(balanceData.value);
      setBalance(fetchedBalance);
      setDanger(fetchedBalance < LOW_BALANCE_THRESHOLD); // Mark as danger if below threshold
    }
  }, [balanceData]);

  return { value: balance, danger }; // Return balance and danger flag
}

export function useMainWalletBalance() {
  const { address } = useAccount(); // Get main wallet account from wagmi
  const [balance, setBalance] = useState<bigint>(0n); // State to store the balance
  const [belowRecommended, setBelowRecommended] = useState(false); // Track if balance is below recommended
  //enabled: !!address, // Fetch balance only if the address exists
  const { data: balanceData } = useBalance({
    address,
  });

  useEffect(() => {
    if (balanceData) {
      const fetchedBalance = BigInt(balanceData.value);
      setBalance(fetchedBalance);
      setBelowRecommended(fetchedBalance < RECOMMENDED_BALANCE); // Mark as below recommended if lower
    }
  }, [balanceData]);

  return { value: balance, belowRecommended }; // Return balance and belowRecommended flag
}
