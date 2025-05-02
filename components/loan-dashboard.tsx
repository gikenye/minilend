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

interface LoanDashboardProps {
  availableCredit: number;
  activeLoan: any | null;
}

export function LoanDashboard({
  availableCredit,
  activeLoan,
}: LoanDashboardProps) {
  const [progress, setProgress] = useState(0);
  const router = useRouter();

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
              <CardDescription>
                Based on your savings in MiniPay
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/deposit")}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Deposit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{availableCredit} USD</div>
              <div className="text-xs text-muted-foreground">
                ≈ {Math.round(availableCredit * 140)} KES
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                {activeLoan.amountLocal} {activeLoan.localCurrency}
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
                  {Math.round(availableCredit * 140)} KES
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
              <span className="font-bold">{availableCredit} USD</span>
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
