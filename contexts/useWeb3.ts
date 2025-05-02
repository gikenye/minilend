"use client";

import { useState, createContext, useContext } from "react";
import type { ReactNode } from "react";
import { stableTokenABI } from "@celo/abis";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  getContract,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Account,
  type Hash,
  type Chain,
  type Abi,
} from "viem";
import { celo, celoAlfajores } from "viem/chains";

// Initialize the public client
const publicClient = createPublicClient({
  chain: celo,
  transport: http(),
});

const STABLE_TOKEN_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

// Create the stable token contract instance
const StableTokenContract = getContract({
  abi: stableTokenABI,
  address: STABLE_TOKEN_ADDRESS,
  client: publicClient,
});

// Define the Web3ContextType interface
export interface Web3ContextType {
  address: string | null;
  publicClient: PublicClient;
  getUserAddress: () => Promise<`0x${string}`>;
  sendCUSD: (to: string, amount: string) => Promise<`0x${string}`>;
  signTransaction: () => Promise<string>;
}

export const Web3Context = createContext<Web3ContextType | undefined>(
  undefined
);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

export const useWeb3Provider = () => {
  const [address, setAddress] = useState<string | null>(null);

  const getUserAddress = async () => {
    if (!window.ethereum) throw new Error("No Ethereum provider found");

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
      chain: celoAlfajores,
    });

    const [address] = await walletClient.getAddresses();
    setAddress(address);
    return address;
  };

  const sendCUSD = async (to: string, amount: string) => {
    if (!window.ethereum) throw new Error("No Ethereum provider found");

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
      chain: celoAlfajores,
    });

    const [address] = await walletClient.getAddresses();

    const hash = await walletClient.writeContract({
      address: STABLE_TOKEN_ADDRESS as `0x${string}`,
      abi: stableTokenABI,
      functionName: "transfer",
      args: [to as `0x${string}`, parseEther(amount)],
      account: address,
    });

    return hash;
  };


  const signTransaction = async () => {
    if (!window.ethereum) throw new Error("No Ethereum provider found");

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
      chain: celoAlfajores,
    });

    const [address] = await walletClient.getAddresses();

    const res = await walletClient.signMessage({
      account: address,
      message: stringToHex("Hello from Celo Composer MiniPay Template!"),
    });

    return res;
  };

  return {
    address,
    publicClient,
    getUserAddress,
    sendCUSD,
    signTransaction,
  };
};
function stringToHex(str: string): `0x${string}` {
  let hex = '0x';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex as `0x${string}`;
}

