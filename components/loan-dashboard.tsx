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
import { CircleDollarSign, Wallet, Plus, Clock, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/contexts/useWeb3";
import { useLending } from "@/contexts/LendingContext";
import { CKES_EXCHANGE_RATE, DEFAULT_CURRENCY } from "@/types/currencies";

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
  const { getWithdrawable, getUserLoan } = useLending();
  const [balance, setBalance] = useState<string>("0");
  const [withdrawable, setWithdrawable] = useState<string>("0");
  const [currentLoan, setCurrentLoan] = useState(activeLoan);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const [balanceResult, withdrawableResult, loanResult] =
          await Promise.all([
            getStableTokenBalance(DEFAULT_CURRENCY),
            getWithdrawable(),
            getUserLoan(),
          ]);

        setBalance(balanceResult);
        setWithdrawable(withdrawableResult.withdrawable);

        if (loanResult && loanResult.active) {
          const principal = Number(loanResult.principal);
          const interest = Number(loanResult.interestAccrued);
          const total = principal + interest;

          // Calculate progress based on remaining principal
          const progressPercent = ((total - principal) / total) * 100;
          setProgress(Math.min(progressPercent, 100));

          setCurrentLoan({
            amountLocal: principal,
            localCurrency: "cKES",
            termDays: 30,
            repaymentSchedule: [],
          });
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };

    fetchBalances();
  }, [getStableTokenBalance, getWithdrawable, getUserLoan]);

  return (
    <div className="space-y-4">
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
                cKES{" "}
                {(Number(withdrawable) * CKES_EXCHANGE_RATE).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold text-foreground mt-6 mb-2 text-center">
        What do you wanna do today?
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {currentLoan && (
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
                cKES {currentLoan.amountLocal.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Due in {currentLoan.termDays} days
              </div>
            </CardContent>
          </Card>
        )}

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
            {currentLoan ? (
              <>
                <Progress value={progress} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">
                  {Math.round(progress)}% repaid
                </div>
              </>
            ) : (
              <div className="text-sm">
                Up to{" "}
                <span className="font-bold">
                  cKES{" "}
                  {(
                    Number(withdrawable) *
                    CKES_EXCHANGE_RATE *
                    0.5
                  ).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

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
                cKES{" "}
                {(Number(withdrawable) * CKES_EXCHANGE_RATE).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

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
              <span className="font-bold text-green-600">
                cKES{" "}
                {(Number(balance) * 0.05 * CKES_EXCHANGE_RATE).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => router.push("/loan-history")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Loan History
            </CardTitle>
            <CardDescription className="text-xs">
              View past transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {currentLoan ? (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Active loan in progress
                </div>
              ) : (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  View all transactions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
