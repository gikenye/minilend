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
import { Input } from "@/components/ui/input";
import { MiniPayHeader } from "@/components/mini-pay-header";
import { Home, ArrowRight, Wallet } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  createWalletClient,
  custom,
  parseUnits,
  formatEther,
  parseGwei,
} from "viem";
import { celoAlfajores } from "viem/chains";
import { useWeb3 } from "@/contexts/useWeb3";
import {
  CKES_EXCHANGE_RATE,
  MIN_WITHDRAWAL_CKES,
  DEFAULT_CURRENCY,
} from "@/types/currencies";
import ProtectedRoute from "@/components/protected-route";

const BASE_GAS = BigInt(21000);

export default function WithdrawPage() {
  const { address, publicClient, getStableTokenBalance, sendStableToken } =
    useWeb3();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState("0");
  const [estimatedFees, setEstimatedFees] = useState("0");

  const estimateWithdrawalFees = async () => {
    if (!address || !publicClient) return;
    try {
      const gasPrice = await publicClient.getGasPrice();
      const estimatedGas = BASE_GAS;
      const fees = formatEther(estimatedGas * gasPrice);
      setEstimatedFees(fees);
    } catch (error) {
      console.error("Error estimating fees:", error);
    }
  };

  const checkBalance = async () => {
    if (!address || !publicClient) return;
    try {
      const balance = await getStableTokenBalance(DEFAULT_CURRENCY);
      setBalance(balance);
      await estimateWithdrawalFees();
    } catch (error) {
      console.error("Error fetching balance:", error);
      toast({
        title: "Error",
        description: "Failed to fetch balance",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !phone || !address || !publicClient || !window?.ethereum)
      return;

    setIsSubmitting(true);
    try {
      const phoneAddress = "0x" + phone.slice(-40);
      const stablecoinAmount = (Number(amount) / CKES_EXCHANGE_RATE).toFixed(6);
      const amountWithFees = Number(stablecoinAmount) + Number(estimatedFees);

      if (amountWithFees > Number(balance)) {
        throw new Error("Insufficient balance including fees");
      }

      const hash = await sendStableToken(
        DEFAULT_CURRENCY,
        phoneAddress,
        stablecoinAmount
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        toast({
          title: "Success!",
          description: `cKES ${amount} has been sent to ${phone}`,
        });
        setAmount("");
        setPhone("");
        checkBalance();
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message ||
          "Could not process your withdrawal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    checkBalance();
  }, [address, publicClient]);

  const availableBalance = Number(balance);
  const maxWithdrawal = availableBalance * CKES_EXCHANGE_RATE;

  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col bg-background">
        <MiniPayHeader />
        <div className="container px-4 py-6 mx-auto space-y-6 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">Cash Out</h1>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Withdraw to M-PESA
              </CardTitle>
              <CardDescription>Send money to your mobile money</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Available Balance
                  </div>
                  <div className="text-2xl font-bold">
                    cKES {maxWithdrawal.toFixed(2)}
                  </div>
                  {Number(estimatedFees) > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Estimated fee: cKES{" "}
                      {(Number(estimatedFees) * CKES_EXCHANGE_RATE).toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="amount">
                    Amount (cKES)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount to withdraw"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min={MIN_WITHDRAWAL_CKES}
                    max={maxWithdrawal}
                  />
                  <div className="text-xs text-muted-foreground">
                    Min: cKES {MIN_WITHDRAWAL_CKES} | Max: cKES{" "}
                    {maxWithdrawal.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="phone">
                    M-PESA Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 07XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    pattern="^(?:254|\+254|0)?([71](?:(?:0[0-8])|(?:[12][0-9])|(?:9[0-9])|(?:4[0-8])|(?:5[0-9])|(?:6[0-9])|(?:7[0-9])|(?:8[0-9]))[0-9]{6})$"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !amount ||
                    !phone ||
                    Number(amount) > maxWithdrawal ||
                    Number(amount) < MIN_WITHDRAWAL_CKES
                  }
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      Send to M-PESA
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
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
