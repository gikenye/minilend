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

export interface EthereumProvider {
  request: (args: any) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isMiniPay?: boolean;
  ethereum?: EthereumProvider & { isMiniPay?: boolean };
  miniPay: MiniPay;
  isConnected: () => boolean;
}

declare global {
  interface Window {
    miniPay: MiniPay;
    ethereum?: EthereumProvider;
  }
}
