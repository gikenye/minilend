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
  hexToBigInt,
  toHex,
  parseGwei,
} from "viem";
import { celo } from "viem/chains";
import { useWeb3 } from "@/contexts/useWeb3";

const STABLE_TOKEN_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
const KES_EXCHANGE_RATE = 140;
const MIN_WITHDRAWAL = 100; // Minimum withdrawal in KES

export default function WithdrawPage() {
  const { address, publicClient } = useWeb3();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState("0");
  const [estimatedFees, setEstimatedFees] = useState("0");

  const estimateWithdrawalFees = async () => {
    if (!address || !publicClient) return;

    try {
      const gasLimit = await publicClient.estimateGas({
        account: address as `0x${string}`,
        to: STABLE_TOKEN_ADDRESS as `0x${string}`,
        value: parseGwei("1"),
        data: "0x",
      });

      const gasPrice = await publicClient.getGasPrice();
      const fees = formatEther(gasLimit * gasPrice);
      setEstimatedFees(fees);
    } catch (error) {
      console.error("Error estimating fees:", error);
    }
  };

  const checkBalance = async () => {
    if (!address || !publicClient) return;
    try {
      const balance = await publicClient.readContract({
        address: STABLE_TOKEN_ADDRESS as `0x${string}`,
        abi: [
          {
            constant: true,
            inputs: [{ name: "accountOwner", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            payable: false,
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      const balanceInEthers = formatEther(balance);
      setBalance(balanceInEthers);
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
    setIsSubmitting(true);

    try {
      if (!window.ethereum?.isMiniPay) {
        throw new Error("Please use MiniPay wallet");
      }

      if (!address) {
        throw new Error("No wallet address found");
      }

      // Validate and format phone number to an Ethereum address using MiniPay registry
      const phoneAddress = `0x${phone.replace(/[^0-9]/g, "")}` as `0x${string}`; // Basic transformation
      if (!phoneAddress.match(/^0x[0-9a-fA-F]{40}$/)) {
        throw new Error("Invalid phone number format");
      }

      const walletClient = createWalletClient({
        chain: celo,
        transport: custom(window.ethereum),
      });

      // Convert KES amount to cUSD
      const cUSDAmount = (Number(amount) / KES_EXCHANGE_RATE).toFixed(2);
      const amountWithFees = Number(cUSDAmount) + Number(estimatedFees);

      if (amountWithFees > Number(balance)) {
        throw new Error("Insufficient balance including fees");
      }

      const hash = await walletClient.writeContract({
        address: STABLE_TOKEN_ADDRESS as `0x${string}`,
        abi: [
          {
            constant: false,
            inputs: [
              { name: "to", type: "address" },
              { name: "value", type: "uint256" },
            ],
            name: "transfer",
            outputs: [{ name: "", type: "bool" }],
            payable: false,
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "transfer",
        args: [phoneAddress, parseUnits(cUSDAmount, 18)],
        account: address as `0x${string}`,
      });

      const transaction = await publicClient.waitForTransactionReceipt({
        hash,
      });

      if (transaction.status === "success") {
        toast({
          title: "Success!",
          description: `KES ${amount} has been sent to ${phone}`,
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
  const maxWithdrawal = availableBalance * KES_EXCHANGE_RATE;

  return (
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
                  USD {availableBalance.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  ≈ KES {maxWithdrawal.toFixed(2)}
                </div>
                {Number(estimatedFees) > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Estimated fee: {Number(estimatedFees).toFixed(4)} cUSD
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="amount">
                  Amount (KES)
                </label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount to withdraw"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min={MIN_WITHDRAWAL}
                  max={maxWithdrawal}
                />
                <div className="text-xs text-muted-foreground">
                  Min: KES {MIN_WITHDRAWAL} | Max: KES{" "}
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
                  Number(amount) < MIN_WITHDRAWAL
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
  );
}
