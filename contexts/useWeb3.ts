import { useState } from "react";
import StableTokenABI from "./cusd-abi.json";
import MinipayNFTABI from "./minipay-nft.json";
import {
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
  http,
  parseEther,
  stringToHex,
  type Abi,
} from "viem";
import { celoAlfajores } from "viem/chains";

const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Testnet
const MINIPAY_NFT_CONTRACT = "0xE8F4699baba6C86DA9729b1B0a1DA1Bd4136eFeF"; // Testnet

// Extract ABIs from the JSON files
const stableTokenAbi = StableTokenABI.abi as Abi;
const minipayNftAbi = MinipayNFTABI.abi as Abi;

export const useWeb3 = () => {
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
    
    const tx = await walletClient.writeContract({
      address: cUSDTokenAddress,
      abi: stableTokenAbi,
      functionName: "transfer",
      args: [to, parseEther(amount)],
      account: address,
    });

    return tx;
  };

  const mintMinipayNFT = async () => {
    if (!window.ethereum) throw new Error("No Ethereum provider found");
    
    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
      chain: celoAlfajores,
    });

    const [address] = await walletClient.getAddresses();
    
    const tx = await walletClient.writeContract({
      address: MINIPAY_NFT_CONTRACT,
      abi: minipayNftAbi,
      functionName: "mint",
      args: [address],
      account: address,
    });

    return tx;
  };

  const getNFTs = async () => {
    if (!address) return [];
    
    const nfts = await publicClient.readContract({
      address: MINIPAY_NFT_CONTRACT,
      abi: minipayNftAbi,
      functionName: "balanceOf",
      args: [address],
    });

    return nfts;
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
    getUserAddress,
    sendCUSD,
    mintMinipayNFT,
    getNFTs,
    signTransaction,
  };
};
