"use client";

import { useState, createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { stableTokenABI } from "@celo/abis";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  formatEther,
  type PublicClient,
  type WalletClient,
} from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { SUPPORTED_CURRENCIES, type Currency } from "@/types/currencies";
import type { EthereumProvider } from "../types/minipay";

// Network configuration
const NETWORK_CONFIG = {
  mainnet: {
    stableTokenAddresses: {
      cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      USDC: "0xeF4229c8c3250C675F21BCefa42f58EfbfF6002a",
      USDT: "0x88eEC49252c8cbc039DCdB394c0c2BA2f1637EA0",
      cKES: "0x3aB28ecedea6CDB6fEed398e93AE18787C0cCf59",
    },
    chainId: "0x42220",
    chainName: "Celo Mainnet",
  },
  testnet: {
    stableTokenAddresses: {
      cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
      USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
      // USDT: "", // No official USDT on Alfajores
    },
    chainId: "0xaef3",
    chainName: "Celo Alfajores Testnet",
  },
} as const;

export function getAvailableCurrencies(
  networkType: keyof typeof NETWORK_CONFIG
): Currency[] {
  return Object.keys(
    NETWORK_CONFIG[networkType].stableTokenAddresses
  ) as Currency[];
}

export type Web3ContextType = {
  address: `0x${string}` | undefined;
  publicClient: PublicClient | undefined;
  walletClient: WalletClient | undefined;
  getStableTokenAddress: (currency: string) => `0x${string}`;
  networkType: "mainnet" | "testnet";
  switchNetwork: (network: "mainnet" | "testnet") => Promise<boolean>;
  isMiniPay: boolean;
  isConnecting?: boolean;
  connectionError?: string | null;
  isInitialized: boolean;
  getUserAddress: () => Promise<string | null>;
  sendStableToken: (
    currency: string,
    to: string,
    amount: string
  ) => Promise<`0x${string}`>;
  signTransaction: () => Promise<string>;
  getStableTokenBalance: (
    currency: string,
    addressToCheck?: string
  ) => Promise<string>;
  availableCurrencies: Currency[];
};

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

const testnetClient = createPublicClient({
  chain: celoAlfajores,
  transport: http("https://alfajores-forno.celo-testnet.org"),
}) as unknown as PublicClient;

const mainnetClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
}) as unknown as PublicClient;

export const useWeb3Provider = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [networkType, setNetworkType] = useState<"mainnet" | "testnet">(
    "testnet"
  );
  const [publicClient, setPublicClient] = useState<PublicClient>(
    () => testnetClient
  );
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(
    getAvailableCurrencies("testnet")
  );

  useEffect(() => {
    setAvailableCurrencies(getAvailableCurrencies(networkType));
  }, [networkType]);

  const getStableTokenAddress = (currency: string): `0x${string}` => {
    if (!SUPPORTED_CURRENCIES[currency as Currency]) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
    const addresses = NETWORK_CONFIG[networkType].stableTokenAddresses;
    if (!(currency in addresses)) {
      throw new Error(
        `Currency ${currency} is not supported on ${networkType}`
      );
    }
    return addresses[currency as keyof typeof addresses] as `0x${string}`;
  };

  const handleNetworkChange = async (chainId: string) => {
    if (window?.ethereum?.isMiniPay) {
      setNetworkType("testnet");
      setPublicClient(testnetClient);
      setAvailableCurrencies(getAvailableCurrencies("testnet"));
      return;
    }
    const network =
      chainId === NETWORK_CONFIG.mainnet.chainId ? "mainnet" : "testnet";
    setNetworkType(network);
    setPublicClient(network === "mainnet" ? mainnetClient : testnetClient);
    setAvailableCurrencies(getAvailableCurrencies(network));
  };

  const checkMiniPayWallet = async () => {
    if (!window.ethereum) {
      console.log("No Ethereum provider found");
      return false;
    }
    setIsMiniPay(!!window.ethereum.isMiniPay);
    if (window.ethereum.isMiniPay) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [],
        });
        setNetworkType("testnet");
        setPublicClient(testnetClient);
        setAvailableCurrencies(getAvailableCurrencies("testnet"));
        if (accounts && accounts[0]) {
          setAddress(accounts[0]);
          return true;
        }
      } catch (error) {
        throw new Error("Failed to connect to MiniPay wallet");
      }
    }
    return false;
  };

  const switchToAlfajores = async () => {
    if (!window.ethereum) return false;
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
        } catch {
          return false;
        }
      }
      return false;
    }
  };

  // Optionally: Add switchToMainnet for completeness
  const switchToMainnet = async () => {
    if (!window.ethereum) return false;
    const mainnetChainId = NETWORK_CONFIG.mainnet.chainId;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: mainnetChainId }],
      });
      return true;
    } catch {
      return false;
    }
  };

  const initializeWallet = async () => {
    try {
      const hasMiniPay = await checkMiniPayWallet();
      if (!hasMiniPay) {
        if (window.ethereum) {
          const chainSwitched = await switchToAlfajores();
          if (!chainSwitched) return;
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts[0]) setAddress(accounts[0]);
        }
      }
    } finally {
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    if (!isInitialized) {
      initializeWallet();
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts: string[]) => {
      setAddress(accounts[0] || null);
    };
    const handleChainChanged = (chainId: string) => {
      handleNetworkChange(chainId);
    };
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
  }, []);

  const getUserAddress = async () => {
    if (!window.ethereum) throw new Error("No Ethereum provider found");
    const [address] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAddress(address);
    return address;
  };

  const getWalletClient = async (
    network: "mainnet" | "testnet" = "mainnet"
  ) => {
    if (!window.ethereum) throw new Error("No Ethereum provider found");
    return createWalletClient({
      transport: custom(window.ethereum),
      chain: network === "mainnet" ? celo : celoAlfajores,
    });
  };

  const sendStableToken = async (
    currency: string,
    to: string,
    amount: string
  ) => {
    if (!window.ethereum) throw new Error("No Ethereum provider found");
    if (!availableCurrencies.includes(currency as Currency)) {
      throw new Error(
        `Currency ${currency} is not supported on ${networkType}`
      );
    }
    const walletClient = await getWalletClient(networkType);
    const [address] = await walletClient.getAddresses();
    const hash = await walletClient.writeContract({
      address: getStableTokenAddress(currency) as `0x${string}`,
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
      message: stringToHex("Hello from MiniPay!"),
    });
    return res;
  };

  const getStableTokenBalance = async (
    currency: string,
    addressToCheck?: string
  ) => {
    try {
      const userAddress = addressToCheck || address;
      if (!userAddress || !publicClient) {
        throw new Error("No address or client available");
      }
      const result = await publicClient.readContract({
        abi: stableTokenABI,
        address: getStableTokenAddress(currency),
        functionName: "balanceOf",
        args: [userAddress as `0x${string}`],
      });
      return formatEther(result);
    } catch (error) {
      throw error;
    }
  };

  return {
    address,
    publicClient,
    getUserAddress,
    sendStableToken,
    signTransaction,
    getStableTokenBalance,
    isMiniPay,
    networkType,
    switchNetwork: async (network: "mainnet" | "testnet") => {
      try {
        if (network === "testnet") {
          return await switchToAlfajores();
        } else if (network === "mainnet") {
          return await switchToMainnet();
        }
        return false;
      } catch {
        return false;
      }
    },
    availableCurrencies,
    getStableTokenAddress,
    isInitialized,
  };
};

function stringToHex(str: string): `0x${string}` {
  let hex = "0x";
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex as `0x${string}`;
}
