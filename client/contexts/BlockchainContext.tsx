import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { publicClient, switchRpcOnFailure, getLogsWithPagination } from '@/lib/blockchain-utils';

interface BlockchainContextType {
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  client: typeof publicClient;
  getLogs: typeof getLogsWithPagination;
}

const defaultContext: BlockchainContextType = {
  isConnected: false,
  isLoading: true,
  error: null,
  client: publicClient,
  getLogs: getLogsWithPagination,
};

const BlockchainContext = createContext<BlockchainContextType>(defaultContext);

export function useBlockchain() {
  return useContext(BlockchainContext);
}

interface BlockchainProviderProps {
  children: ReactNode;
}

export function BlockchainProvider({ children }: BlockchainProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        
        // Try to get block number to verify connection
        await switchRpcOnFailure(async (rpcUrl) => {
          const blockNumber = await publicClient.getBlockNumber();
          console.log(`Connected to blockchain at block ${blockNumber}`);
          return blockNumber;
        });
        
        setIsConnected(true);
        setError(null);
      } catch (err) {
        console.error('Blockchain connection error:', err);
        setError(err instanceof Error ? err : new Error('Unknown connection error'));
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  const value = {
    isConnected,
    isLoading,
    error,
    client: publicClient,
    getLogs: getLogsWithPagination,
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
} 