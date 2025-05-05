"use client";

import React, { useEffect, useState } from "react";
import {
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  formatEther,
  getContract,
} from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { Web3Context, getAvailableCurrencies } from "./useWeb3";
import { type Currency } from "@/types/currencies";
import { type EthereumProvider } from "./useWeb3";
import { stableTokenABI } from "@celo/abis";

// A mapping of currency symbols to their stablecoin contract addresses
const STABLECOIN_ADDRESSES: Record<string, `0x${string}`> = {
  USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as const,
  USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7" as const,
  cUSD: "0x765de816845861e75a25fca122bb6898b8b1282a" as const,
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Initialize public clients for both networks
const mainnetClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
}) as unknown as PublicClient;

const testnetClient = createPublicClient({
  chain: celoAlfajores,
  transport: http("https://alfajores-forno.celo-testnet.org"),
}) as unknown as PublicClient;

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient>();
  const [publicClient, setPublicClient] = useState<PublicClient>(testnetClient);
  const [networkType, setNetworkType] = useState<"mainnet" | "testnet">(
    "testnet"
  );
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(
    getAvailableCurrencies("testnet")
  );

  const getStableTokenAddress = (currency: string): `0x${string}` => {
    const addr = STABLECOIN_ADDRESSES[currency];
    if (!addr) throw new Error(`Unsupported currency: ${currency}`);
    return addr;
  };

  const switchToAlfajores = async () => {
    if (!window.ethereum) {
      console.error("No Ethereum provider found");
      return false;
    }

    const alfajoresChainId = `0x${celoAlfajores.id.toString(16)}`;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: alfajoresChainId }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: alfajoresChainId,
                chainName: "Celo Alfajores Testnet",
                nativeCurrency: {
                  name: "Celo",
                  symbol: "CELO",
                  decimals: 18,
                },
                rpcUrls: [
                  "https://alfajores-forno.celo-testnet.org",
                  "https://alfajores-rpc.celo.org",
                  "https://alfajores.infura.io/v3",
                ],
                blockExplorerUrls: ["https://alfajores.celoscan.io/"],
                iconUrls: ["https://celo.org/favicon.ico"],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add Alfajores chain:", addError);
          return false;
        }
      }
      console.error("Failed to switch to Alfajores chain:", switchError);
      return false;
    }
  };

  const stringToHex = (str: string): `0x${string}` => {
    let hex = "0x";
    for (let i = 0; i < str.length; i++) {
      hex += str.charCodeAt(i).toString(16).padStart(2, "0");
    }
    return hex as `0x${string}`;
  };

  useEffect(() => {
    const initializeWallet = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;

      try {
        const client = createWalletClient({
          transport: custom(window.ethereum),
          chain: networkType === "mainnet" ? celo : celoAlfajores,
        });

        setWalletClient(client);

        const [address] = await client.getAddresses();
        setAddress(address);

        const handleAccountsChanged = (accounts: string[]) => {
          setAddress(accounts[0] ? (accounts[0] as `0x${string}`) : null);
        };

        const handleChainChanged = (chainId: string) => {
          const newNetworkType = chainId === "0x42220" ? "mainnet" : "testnet";
          setNetworkType(newNetworkType);
          setPublicClient(
            newNetworkType === "mainnet" ? mainnetClient : testnetClient
          );
        };

        // Set up event listeners
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
          if (window.ethereum) {
            window.ethereum.removeListener(
              "accountsChanged",
              handleAccountsChanged
            );
            window.ethereum.removeListener("chainChanged", handleChainChanged);
          }
        };
      } catch (error) {
        console.error("Failed to initialize wallet:", error);
      }
    };

    initializeWallet();
  }, [networkType]);

  return (
    <Web3Context.Provider
      value={{
        address: address || undefined,
        publicClient,
        walletClient,
        getStableTokenAddress,
        networkType,
        switchNetwork: async (network: "mainnet" | "testnet") => {
          try {
            if (network === "testnet") {
              return await switchToAlfajores();
            }
            // TODO: Implement mainnet switch
            return false;
          } catch (error) {
            console.error("Failed to switch network:", error);
            return false;
          }
        },
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
        ) => {
          if (!window.ethereum) throw new Error("No Ethereum provider found");
          if (!walletClient) throw new Error("Wallet not connected");

          const hash = await walletClient.writeContract({
            address: getStableTokenAddress(currency) as `0x${string}`,
            abi: stableTokenABI,
            functionName: "transfer",
            args: [to as `0x${string}`, parseEther(amount)],
            account: address as `0x${string}`,
          });

          return hash;
        },
        signTransaction: async () => {
          if (!window.ethereum) throw new Error("No Ethereum provider found");
          if (!walletClient || !address)
            throw new Error("Wallet not connected");

          const signature = await walletClient.signMessage({
            account: address,
            message: stringToHex("Hello from MiniPay!"),
          });

          return signature;
        },
        getStableTokenBalance: async (
          currency: string,
          addressToCheck?: string
        ) => {
          const userAddress = addressToCheck || address;
          if (!userAddress || !publicClient) {
            throw new Error("No address or public client available");
          }

          const StableTokenContract = getContract({
            abi: stableTokenABI,
            address: getStableTokenAddress(currency) as `0x${string}`,
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
