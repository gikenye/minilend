"use client";

import React, { useEffect, useState } from "react";
import {
  createWalletClient,
  custom,
  http,
  parseEther,
  formatEther,
  type PublicClient,
  type WalletClient,
  type Hash,
  type Account,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { Web3Context, getAvailableCurrencies } from "./useWeb3";
import { type Currency } from "@/types/currencies";
import { stableTokenABI } from "@celo/abis";
import type { EthereumProvider } from "../types/minipay";
import { publicClient, switchRpcOnFailure, resetRpcConnection, executeWithRpcFallback } from "@/lib/blockchain-utils";

const STABLECOIN_ADDRESSES: Record<string, `0x${string}`> = {
  cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Correct Alfajores cUSD
  USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B", // (if you use USDC on Alfajores)
};


declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [walletClient, setWalletClient] = useState<WalletClient>();
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(
    getAvailableCurrencies("testnet")
  );

  // Get stable token address
  const getStableTokenAddress = (currency: string): `0x${string}` => {
    const addr = STABLECOIN_ADDRESSES[currency];
    if (!addr) throw new Error(`Unsupported currency: ${currency}`);
    return addr;
  };

  // Helper function to get balance with any client
  const getBalanceWithClient = async (
    client: PublicClient,
    currency: string,
    addressToCheck?: string
  ): Promise<string> => {
    const userAddr = addressToCheck || address;
    if (!userAddr) return "0"; // Return 0 if no address available

    try {
      // Use the switchRpcOnFailure utility to handle RPC errors
      return await switchRpcOnFailure(async (rpcUrl) => {
        const tokenAddress = getStableTokenAddress(currency);
        // Use readContract directly which is more reliable
        const balance = await client.readContract({
          address: tokenAddress,
          abi: stableTokenABI,
          functionName: "balanceOf",
          args: [userAddr as `0x${string}`],
        });
        
        return formatEther(balance);
      });
    } catch (error) {
      console.error("Error reading token balance:", error);
      // Return zero balance on error rather than crashing
      return "0";
    }
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
      
      setIsConnecting(true);
      setConnectionError(null);
      
      try {
        // Reset RPC connection for a fresh start
        resetRpcConnection();
        
        // Use executeWithRpcFallback for better resilience
        await executeWithRpcFallback(async () => {
          // Rest of the initialization code
          const provider = window.ethereum as EthereumProvider;
          setIsMiniPay(!!provider.isMiniPay);
          
          // Check if already connected
          const accounts = await provider.request<string[]>({
            method: "eth_accounts",
          });
          
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0] as `0x${string}`);
          }
          
          // Check chain ID
          const chainId = await provider.request<string>({
            method: "eth_chainId",
          });
          
          // Rest of your initialization logic
          return true;
        });
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Blockchain connection error:", error);
        setConnectionError(error instanceof Error ? error.message : "Unknown connection error");
      } finally {
        setIsConnecting(false);
      }
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
        isConnecting,
        connectionError, 
        switchNetwork: async () => true, // Only Alfajores supported for MiniPay
        isMiniPay,
        getUserAddress: async () => {
          if (!window.ethereum) throw new Error("No Ethereum provider found");
          
          return await executeWithRpcFallback(async () => {
            const accounts = await window.ethereum.request({
              method: "eth_requestAccounts",
            });
            if (accounts && accounts[0]) {
              setAddress(accounts[0] as `0x${string}`);
              return accounts[0];
            }
            return null;
          });
        },
        sendStableToken: async (
          currency: string,
          to: string,
          amount: string
        ): Promise<Hash> => {
          if (!walletClient || !address)
            throw new Error("Wallet not connected");

          return await switchRpcOnFailure(async (rpcUrl) => {
            return walletClient.writeContract({
              address: getStableTokenAddress(currency),
              abi: stableTokenABI,
              functionName: "transfer",
              args: [to as `0x${string}`, parseEther(amount)],
              account: { address: address } as Account,
              chain: celoAlfajores,
            });
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
          return getBalanceWithClient(publicClient, currency, addressToCheck);
        },
        availableCurrencies,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}