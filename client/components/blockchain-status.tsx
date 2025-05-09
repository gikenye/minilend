"use client";

import { useWeb3 } from "@/contexts/useWeb3";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { publicClient, switchRpcOnFailure } from "@/lib/blockchain-utils";

export function BlockchainStatus() {
  const { isConnecting, connectionError } = useWeb3();
  const [isRetrying, setIsRetrying] = useState(false);

  if (!connectionError) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Test connection with our utility
      await switchRpcOnFailure(async (rpcUrl) => {
        const blockNumber = await publicClient.getBlockNumber();
        console.log(`Connected to blockchain at block ${blockNumber}`);
        return blockNumber;
      });
      
      // Force page reload to refresh all connections
      window.location.reload();
    } catch (error) {
      console.error("Failed to reconnect:", error);
      setIsRetrying(false);
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        Blockchain Connection Error
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          {connectionError === "The request timed out."
            ? "The connection to the blockchain network timed out. This may be due to network congestion or an issue with the RPC provider."
            : connectionError}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRetry}
          disabled={isRetrying || isConnecting}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-3 w-3" />
          {isRetrying ? "Retrying..." : "Retry Connection"}
        </Button>
      </AlertDescription>
    </Alert>
  );
} 