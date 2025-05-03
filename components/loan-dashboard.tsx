"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { CircleDollarSign, Wallet, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/contexts/useWeb3";
import { KES_EXCHANGE_RATE, DEFAULT_CURRENCY } from "@/types/currencies";

interface LoanDashboardProps {
  availableCredit: number;
  activeLoan?: {
    amountLocal: number;
    localCurrency: string;
    termDays: number;
    repaymentSchedule: any[];
  } | null;
}

export function LoanDashboard({
  availableCredit,
  activeLoan,
}: LoanDashboardProps) {
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { getStableTokenBalance } = useWeb3();
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await getStableTokenBalance(DEFAULT_CURRENCY);
        setBalance(balance);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };
    fetchBalance();
  }, [getStableTokenBalance]);

  useEffect(() => {
    if (activeLoan) {
      const paidPayments = activeLoan.repaymentSchedule.filter(
        (p: any) => p.status === "paid"
      ).length;
      const totalPayments = activeLoan.repaymentSchedule.length;
      const calculatedProgress = Math.round(
        (paidPayments / totalPayments) * 100
      );

      const timer = setTimeout(() => setProgress(calculatedProgress), 500);
      return () => clearTimeout(timer);
    }
  }, [activeLoan]);

  return (
    <div className="space-y-4">
      {/* Loan Limit Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Loan Limit</CardTitle>
              <CardDescription>Based on your savings balance</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/deposit")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Money
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">
                KES {(Number(balance) * KES_EXCHANGE_RATE).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold text-foreground mt-6 mb-2 text-center">
        What do you wanna do today?
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Current Loan Card */}
        {activeLoan && (
          <Card
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => router.push("/active-loan")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current Loan</CardTitle>
              <CardDescription className="text-xs">
                Active loan details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold">
                {activeLoan.localCurrency}{" "}
                {activeLoan.amountLocal.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Due in {activeLoan.termDays} days
              </div>
            </CardContent>
          </Card>
        )}

        {/* Get Money Card */}
        <Card
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => router.push("/apply-loan")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Get Money
            </CardTitle>
            <CardDescription className="text-xs">
              Quick loan based on savings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeLoan ? (
              <>
                <Progress value={progress} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">
                  {progress}% repaid
                </div>
              </>
            ) : (
              <div className="text-sm">
                Up to{" "}
                <span className="font-bold">
                  KES {(Number(balance) * KES_EXCHANGE_RATE).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Out Card */}
        <Card
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => router.push("/withdraw")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cash Out</CardTitle>
            <CardDescription className="text-xs">
              Send to M-PESA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <span className="font-bold">
                KES {(Number(balance) * KES_EXCHANGE_RATE).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Card */}
        <Card
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => router.push("/earnings")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Your Rewards</CardTitle>
            <CardDescription className="text-xs">Earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <span className="font-bold text-green-600">450 KES</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
