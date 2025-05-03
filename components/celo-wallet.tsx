"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { useWeb3 } from "@/contexts/useWeb3";
import { toast } from "@/components/ui/use-toast";

export interface Web3ContextType {
  address: string | null;
  networkType: "mainnet" | "testnet";
  switchNetwork: (network: "mainnet" | "testnet") => Promise<boolean>;
  isMiniPay: boolean;
  getStableTokenBalance: (
    currency: string,
    addressToCheck?: string
  ) => Promise<string>;
}

export function CeloWallet() {
  const {
    address,
    networkType,
    switchNetwork,
    isMiniPay,
    getStableTokenBalance,
  } = useWeb3() as Web3ContextType;
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  const fetchBalance = async () => {
    if (!address) {
      setError("No wallet address connected");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const balance = await getStableTokenBalance("cUSD");
      setBalance(balance);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Failed to fetch wallet balance: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNetworkSwitch = async (targetNetwork: "mainnet" | "testnet") => {
    setIsNetworkSwitching(true);
    try {
      await switchNetwork(targetNetwork);
      await fetchBalance();
    } catch (error: any) {
      console.error("Failed to switch network:", error);
      const errorMessage =
        error?.message || "Could not switch network. Please try again.";
      toast({
        title: "Network Switch Notice",
        description: errorMessage,
        variant: isMiniPay ? "default" : "destructive",
      });
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address, networkType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Wallet</CardTitle>
        <CardDescription>
          Your current cUSD balance on Celo network
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Balance</div>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : (
            <div className="text-xl font-bold">
              {Number(balance).toFixed(2)} cUSD
            </div>
          )}
          {address && (
            <div className="text-xs text-muted-foreground">
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={fetchBalance}
          disabled={isLoading || isNetworkSwitching}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Update Balance
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
