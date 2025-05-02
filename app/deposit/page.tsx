"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { MiniPayHeader } from "@/components/mini-pay-header";
import {
  Home,
  ArrowRight,
  Plus,
  CircleDollarSign,
  ExternalLink,
} from "lucide-react";
import { useWeb3 } from "@/contexts/useWeb3";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import { stableTokenABI } from "@celo/abis";
import {
  createPublicClient,
  http,
  getContract,
  formatEther,
  parseGwei,
  type GetContractReturnType,
  type PublicClient,
} from "viem";
import { celo } from "viem/chains";

const STABLE_TOKEN_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
const MIN_BALANCE_THRESHOLD = 0.01; // Minimum balance threshold in cUSD
const KES_EXCHANGE_RATE = 140;
const REFRESH_INTERVAL = 15000; // Check balance every 15 seconds

export default function DepositPage() {
  const { address, publicClient } = useWeb3();
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<string>("0");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [estimatedFees, setEstimatedFees] = useState<string>("0");

  const checkWallet = async () => {
    if (window && window.ethereum) {
      setIsMiniPay(!!window.ethereum.isMiniPay);
      if (window.ethereum.isMiniPay) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
          params: [],
        });
        // MiniPay will inject one address
        if (accounts && accounts[0]) {
          console.log("Connected to MiniPay wallet:", accounts[0]);
          return true;
        }
      }
    }
    return false;
  };

  const estimateTransactionFees = async () => {
    if (!address || !publicClient) return;

    try {
      const estimatedGas = await publicClient.estimateGas({
        account: address as `0x${string}`,
        to: STABLE_TOKEN_ADDRESS as `0x${string}`,
        value: BigInt(1), // Minimal value for estimation
        data: "0x",
      });

      const gasPrice = (await publicClient.request({
        method: "eth_gasPrice",
        args: [],
      })) as `0x${string}`;

      const gasPriceBigInt = BigInt(gasPrice);
      const fees = formatEther(estimatedGas * gasPriceBigInt);
      setEstimatedFees(fees);
    } catch (error) {
      console.error("Error estimating fees:", error);
    }
  };

  const checkBalance = async () => {
    if (!address || !publicClient) return;

    try {
      const balanceInBigNumber = await publicClient.readContract({
        address: STABLE_TOKEN_ADDRESS as `0x${string}`,
        abi: stableTokenABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      const balanceInEthers = formatEther(balanceInBigNumber);
      setBalance(balanceInEthers);
      await estimateTransactionFees();
    } catch (error) {
      console.error("Error fetching balance:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your balance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkBalance();
  };

  useEffect(() => {
    const init = async () => {
      const hasWallet = await checkWallet();
      if (hasWallet) {
        await checkBalance();
      }
    };
    init();

    // Set up auto refresh if wallet is connected
    const interval = setInterval(() => {
      if (window?.ethereum?.isMiniPay) {
        checkBalance();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [address, publicClient]);

  const isLowBalance = Number(balance) < MIN_BALANCE_THRESHOLD;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <MiniPayHeader />
      <div className="container px-4 py-6 mx-auto space-y-6 max-w-md">
        <h1 className="text-2xl font-bold text-foreground">Add Money</h1>

        {/* Current Balance Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              Current Balance
            </CardTitle>
            <CardDescription>Your available balance in MiniPay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">
                {Number(balance).toFixed(2)} cUSD
              </div>
              <div className="text-sm text-muted-foreground">
                ≈ KES {(Number(balance) * KES_EXCHANGE_RATE).toFixed(2)}
              </div>
              {Number(estimatedFees) > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Estimated transaction fee: {Number(estimatedFees).toFixed(4)}{" "}
                  cUSD
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full"
            >
              {isRefreshing ? "Checking..." : "Check Balance"}
              {!isRefreshing && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </CardContent>
        </Card>

        {/* Deposit Instructions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              How to Add Money
            </CardTitle>
            <CardDescription>
              {isMiniPay
                ? "Follow these steps to deposit funds"
                : "Please use MiniPay wallet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isMiniPay ? (
              <Alert>
                <AlertDescription>
                  Please install and use the MiniPay wallet to access all
                  features.
                </AlertDescription>
              </Alert>
            ) : (
              isLowBalance && (
                <Alert variant="destructive">
                  <AlertDescription className="space-y-2">
                    <p className="font-medium">Insufficient Balance</p>
                    <p>
                      You need at least {MIN_BALANCE_THRESHOLD} cUSD to use
                      MiniPay features. Current balance:{" "}
                      {Number(balance).toFixed(2)} cUSD
                    </p>
                  </AlertDescription>
                </Alert>
              )
            )}

            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="text-sm font-medium mb-3">To deposit funds:</div>
              <ol className="text-sm text-muted-foreground list-decimal pl-4 space-y-3">
                <li>Open your MiniPay wallet app</li>
                <li>Navigate to the 'Add Funds' section</li>
                <li>
                  Choose your preferred deposit method (M-PESA, Bank, etc.)
                </li>
                <li>Follow the instructions to complete your deposit</li>
                <li>
                  Return here and click 'Check Balance' to see your updated
                  balance
                </li>
              </ol>
            </div>

            <Button
              className="w-full"
              onClick={() => window.open("minipay://wallet")}
            >
              Open MiniPay Wallet
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => (window.location.href = "/")}
        >
          <Home className="h-6 w-6" />
          <span className="sr-only">Go to Home</span>
        </Button>
      </div>
    </main>
  );
}
