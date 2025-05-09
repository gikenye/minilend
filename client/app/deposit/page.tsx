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
import ProtectedRoute from "@/components/protected-route";
import {
  MIN_BALANCE_THRESHOLD,
  CKES_EXCHANGE_RATE,
  DEFAULT_CURRENCY,
} from "@/types/currencies";
import { MiniPayDeposit } from "@/components/minipay-deposit";

const REFRESH_INTERVAL = 15000; // Check balance every 15 seconds

export default function DepositPage() {
  const { address, publicClient, getStableTokenBalance } = useWeb3();
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
        if (accounts && accounts[0]) {
          console.log("Connected to MiniPay wallet:", accounts[0]);
          return true;
        }
      }
    }
    return false;
  };

  const checkBalance = async () => {
    if (!address || !publicClient) return;
    setIsRefreshing(true);
    try {
      const balance = await getStableTokenBalance(DEFAULT_CURRENCY);
      setBalance(balance);
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
    <ProtectedRoute>
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
              <CardDescription>Your available balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-2xl font-bold">
                  cKES {(Number(balance) * CKES_EXCHANGE_RATE).toFixed(2)}
                </div>
                {Number(estimatedFees) > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Estimated fee: cKES{" "}
                    {(Number(estimatedFees) * CKES_EXCHANGE_RATE).toFixed(2)}
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

          {/* MiniPay Deposit Component - Only show if in MiniPay */}
          {isMiniPay && <MiniPayDeposit onDepositComplete={handleRefresh} />}

          {/* Deposit Instructions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                {isMiniPay ? "Other Ways to Add Money" : "How to Add Money"}
              </CardTitle>
              <CardDescription>
                {isMiniPay
                  ? "Additional options to fund your account"
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
                        Your balance is too low for transactions. Please add
                        funds to continue.
                      </p>
                    </AlertDescription>
                  </Alert>
                )
              )}

              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="text-sm font-medium mb-3">
                  To deposit funds:
                </div>
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
    </ProtectedRoute>
  );
}
