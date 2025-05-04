type NetworkType = "mainnet" | "testnet";

interface NetworkInfo {
  chainId: string;
  networkVersion: string;
  name: string;
}

interface MiniPay {
  signMessage(message: string): Promise<string>;
  isConnected(): boolean;
  connect(): Promise<void>;
  getNetwork(): Promise<NetworkInfo>;
  switchNetwork(network: NetworkType): Promise<void>;
}

declare global {
  interface Window {
    miniPay: MiniPay;
    ethereum?: EthereumProvider;
  }
}
