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
  getContract,
  formatEther,
  type Client,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Account,
  type Hash,
  type Chain,
  type Abi,
} from "viem";
import { celo, celoAlfajores } from "viem/chains";
import { SUPPORTED_CURRENCIES, type Currency } from "@/types/currencies";

export interface EthereumProvider {
  request: (args: any) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isMiniPay?: boolean;
}

// A mapping of currency symbols to their stablecoin contract addresses
export const STABLECOIN_ADDRESSES: Record<string, `0x${string}`> = {
  USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as const,
  USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7" as const,
  cUSD: "0x765de816845861e75a25fca122bb6898b8b1282a" as const,
};

// Initialize public clients for both networks
const mainnetClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
}) as unknown as PublicClient;

const testnetClient = createPublicClient({
  chain: celoAlfajores,
  transport: http("https://alfajores-forno.celo-testnet.org"),
}) as unknown as PublicClient;

// Token addresses for both networks
const NETWORK_CONFIG = {
  mainnet: {
    stableTokenAddresses: {
      cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      USDC: "0xeF4229c8c3250C675F21BCefa42f58EfbfF6002a",
      USDT: "0x88eEC49252c8cbc039DCdB394c0c2BA2f1637EA0",
      cKES: "0x3aB28ecedea6CDB6fEed398e93AE18787C0cCf59", // Mainnet only
    },
    chainId: "0x42220",
    chainName: "Celo Mainnet",
  },
  testnet: {
    stableTokenAddresses: {
      cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
      USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
      USDT: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    },
    chainId: "0xaef3",
    chainName: "Celo Alfajores Testnet",
  },
} as const;

// Utility: get available currencies for current network
export function getAvailableCurrencies(
  networkType: "mainnet" | "testnet"
): Currency[] {
  return Object.keys(
    NETWORK_CONFIG[networkType].stableTokenAddresses
  ) as Currency[];
}

// Define the Web3ContextType interface
export type Web3ContextType = {
  address: `0x${string}` | undefined;
  publicClient: PublicClient | undefined;
  walletClient: WalletClient | undefined;
  getStableTokenAddress: (currency: string) => `0x${string}`;
  networkType: "mainnet" | "testnet";
  switchNetwork: (network: "mainnet" | "testnet") => Promise<boolean>;
  isMiniPay: boolean;
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

export const useWeb3Provider = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [networkType, setNetworkType] = useState<"mainnet" | "testnet">(
    "testnet"
  );
  const [publicClient, setPublicClient] = useState<PublicClient>(() => {
    // Start with testnet by default
    return createPublicClient({
      chain: celoAlfajores,
      transport: http("https://alfajores-forno.celo-testnet.org"),
    }) as unknown as PublicClient;
  });
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(
    getAvailableCurrencies("testnet")
  );

  // Update available currencies when network changes
  useEffect(() => {
    setAvailableCurrencies(getAvailableCurrencies(networkType));
  }, [networkType]);

  // Get the current stable token address based on network type and currency
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

    const address = addresses[currency as keyof typeof addresses];
    return address as `0x${string}`;
  };

  const getCurrentNetwork = async () => {
    if (!window.ethereum) return null;
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    return chainId === NETWORK_CONFIG.mainnet.chainId ? "mainnet" : "testnet";
  };

  const handleNetworkChange = async (chainId: string) => {
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
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
        params: [],
      });
      if (accounts && accounts[0]) {
        console.log("Connected to MiniPay wallet:", accounts[0]);
        setAddress(accounts[0]);
        // Detect initial network for MiniPay
        const network = await getCurrentNetwork();
        if (network) {
          setNetworkType(network);
          setPublicClient(
            network === "mainnet" ? mainnetClient : testnetClient
          );
          setAvailableCurrencies(getAvailableCurrencies(network));
        }
        return true;
      }
    }
    return false;
  };

  const switchToAlfajores = async () => {
    if (!window.ethereum) {
      console.error("No Ethereum provider found");
      return false;
    }

    const alfajoresChainId = `0x${celoAlfajores.id.toString(16)}`;
    console.log("Attempting to switch to Alfajores chain:", alfajoresChainId);

    try {
      // First try to switch to the chain
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: alfajoresChainId }],
      });
      console.log("Successfully switched to Alfajores");
      return true;
    } catch (switchError: any) {
      console.log("Switch chain error details:", {
        code: switchError.code,
        message: switchError.message,
        data: switchError.data,
      });

      // Chain hasn't been added yet
      if (switchError.code === 4902) {
        try {
          console.log("Adding Alfajores chain to wallet...");
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
          console.log("Successfully added Alfajores chain");
          return true;
        } catch (addError: any) {
          console.error("Failed to add Alfajores chain:", {
            code: addError.code,
            message: addError.message,
            data: addError.data,
          });
          return false;
        }
      }
      console.error("Failed to switch to Alfajores chain:", switchError);
      return false;
    }
  };

  const initializeWallet = async () => {
    try {
      const hasMiniPay = await checkMiniPayWallet();
      if (!hasMiniPay) {
        if (window.ethereum) {
          console.log("Initializing regular wallet...");
          const chainSwitched = await switchToAlfajores();
          if (!chainSwitched) {
            console.error("Could not switch to Alfajores chain");
            return;
          }
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts[0]) {
            setAddress(accounts[0]);
            console.log("Connected to regular wallet:", accounts[0]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to initialize wallet:", error);
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
      console.log("Accounts changed:", accounts);
      setAddress(accounts[0] || null);
    };

    const handleChainChanged = (chainId: string) => {
      console.log("Chain changed:", chainId);
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

    console.log("🔗 Connected wallet address:", address);
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

    // Defensive: ensure currency is supported on current network
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
      if (!userAddress) {
        throw new Error("No address provided");
      }
      // Defensive: ensure currency is supported on current network
      if (!availableCurrencies.includes(currency as Currency)) {
        throw new Error(
          `Currency ${currency} is not supported on ${networkType}`
        );
      }

      const StableTokenContract = getContract({
        abi: [
          {
            constant: true,
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ],
        address: getStableTokenAddress(currency),
        publicClient,
      });

      const balanceInBigNumber = await StableTokenContract.read.balanceOf([
        userAddress as `0x${string}`,
      ]);

      return formatEther(balanceInBigNumber);
    } catch (error) {
      console.error(`Error getting ${currency} balance:`, error);
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
        }
        // TODO: Implement mainnet switch
        return false;
      } catch (error) {
        console.error("Failed to switch network:", error);
        return false;
      }
    },
    availableCurrencies,
    getStableTokenAddress,
  };
};

function stringToHex(str: string): `0x${string}` {
  let hex = "0x";
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex as `0x${string}`;
}
