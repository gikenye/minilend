interface MiniPay {
  signMessage(message: string): Promise<string>;
  isConnected(): boolean;
  connect(): Promise<void>;
}

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMiniPay?: boolean;
}

interface Window {
  miniPay: MiniPay;
  ethereum?: EthereumProvider;
}
