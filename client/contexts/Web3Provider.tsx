"use client";

import React, { useEffect, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  formatEther,
  type PublicClient,
  type WalletClient,
  type Hash,
  type Account,
  getContract, // <-- import getContract
} from "viem";
import { celoAlfajores } from "viem/chains";
import { Web3Context, getAvailableCurrencies } from "./useWeb3";
import { type Currency } from "@/types/currencies";
import { stableTokenABI } from "@celo/abis";
import type { EthereumProvider } from "../types/minipay";

// Only Alfajores addresses for MiniPay
const STABLECOIN_ADDRESSES: Record<string, `0x${string}`> = {
  cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a", // Alfajores cUSD
  USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
  USDT: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [walletClient, setWalletClient] = useState<WalletClient>();
  const [publicClient, setPublicClient] = useState<PublicClient>();
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(
    getAvailableCurrencies("testnet")
  );

  // Get stable token address
  const getStableTokenAddress = (currency: string): `0x${string}` => {
    const addr = STABLECOIN_ADDRESSES[currency];
    if (!addr) throw new Error(`Unsupported currency: ${currency}`);
    return addr;
  };

  // String to hex utility
  const stringToHex = (str: string): `0x${string}` => {
    let hex = "0x";
    for (let i = 0; i < str.length; i++) {
      hex += str.charCodeAt(i).toString(16).padStart(2, "0");
    }
    return hex as `0x${string}`;
  };

  useEffect(() => {
    async function init() {
      if (typeof window === "undefined" || !window.ethereum) return;

      setIsMiniPay(!!window.ethereum.isMiniPay);

      // Always use Alfajores for MiniPay
      setAvailableCurrencies(getAvailableCurrencies("testnet"));

      // viem wallet client using MiniPay/injected provider
      const wc = createWalletClient({
        transport: custom(window.ethereum),
        chain: celoAlfajores,
      });
      setWalletClient(wc);

      // viem public client for reading
      const transport = http("https://alfajores-forno.celo-testnet.org");
      const pc = createPublicClient({
        chain: celoAlfajores,
        transport,
        batch: {
          multicall: true,
        },
        pollingInterval: 4_000,
      });
      setPublicClient(pc as unknown as PublicClient);

      // Request address (MiniPay docs)
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [],
        });
        setAddress(accounts?.[0]);
      } catch {
        setAddress(undefined);
      }

      // Listen for account changes
      const handleAccountsChanged = (accounts: string[]) => {
        setAddress(accounts[0] ? (accounts[0] as `0x${string}`) : undefined);
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        window.ethereum?.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }

    init();
  }, []);

  return (
    <Web3Context.Provider
      value={{
        address,
        publicClient,
        walletClient,
        getStableTokenAddress,
        networkType: "testnet",
        switchNetwork: async () => true, // Only Alfajores supported for MiniPay
        isMiniPay,
        getUserAddress: async () => {
          if (!window.ethereum) throw new Error("No Ethereum provider found");
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts[0]) {
            setAddress(accounts[0] as `0x${string}`);
            return accounts[0];
          }
          return null;
        },
        sendStableToken: async (
          currency: string,
          to: string,
          amount: string
        ): Promise<Hash> => {
          if (!walletClient || !address)
            throw new Error("Wallet not connected");

          return walletClient.writeContract({
            address: getStableTokenAddress(currency),
            abi: stableTokenABI,
            functionName: "transfer",
            args: [to as `0x${string}`, parseEther(amount)],
            account: { address: address } as Account,
            chain: celoAlfajores,
          });
        },
        signTransaction: async (): Promise<Hash> => {
          if (!walletClient || !address)
            throw new Error("Wallet not connected");

          return walletClient.signMessage({
            account: { address: address } as Account,
            message: stringToHex("Hello from MiniPay!"),
          });
        },
        getStableTokenBalance: async (
          currency: string,
          addressToCheck?: string
        ): Promise<string> => {
          if (!publicClient) throw new Error("No public client available");
          const userAddress = addressToCheck || address;
          if (!userAddress) throw new Error("No address available");

          // --- DOCS-COMPLIANT: Use getContract for reading balances ---
          const StableTokenContract = getContract({
            abi: stableTokenABI,
            address: getStableTokenAddress(currency),
            client: publicClient,
          });
          const balanceInBigNumber = await StableTokenContract.read.balanceOf([
            userAddress as `0x${string}`,
          ]);
          return formatEther(balanceInBigNumber);
        },
        availableCurrencies,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
