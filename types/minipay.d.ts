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
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  isMiniPay?: boolean;
  networkVersion?: string;
  chainId?: string;
}

interface Window {
  miniPay: MiniPay;
  ethereum?: EthereumProvider;
}
