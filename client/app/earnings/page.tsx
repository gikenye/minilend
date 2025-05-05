"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MiniPayHeader } from "@/components/mini-pay-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Home, TrendingUp, CircleDollarSign } from "lucide-react";
import { useLending } from "@/contexts/LendingContext";
import { useWeb3 } from "@/contexts/useWeb3";
import { CKES_EXCHANGE_RATE } from "@/types/currencies";
import ProtectedRoute from "@/components/protected-route";

interface RecentTransaction {
  id: number;
  amount: number;
  type: string;
  date: string;
  status: string;
}

export default function EarningsPage() {
  const { getYields } = useLending();
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    activeLoans: 0,
    totalLent: 0,
    currency: "cKES",
    recentTransactions: [] as RecentTransaction[],
  });

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const yields = await getYields();

        // Convert yields to local currency
        const grossYield = Number(yields.grossYield) * CKES_EXCHANGE_RATE;
        const netYield = Number(yields.netYield) * CKES_EXCHANGE_RATE;
        const usedForLoanRepayment =
          Number(yields.usedForLoanRepayment) * CKES_EXCHANGE_RATE;

        setEarnings({
          totalEarned: netYield,
          activeLoans: 1, // Could be calculated from active loans in future
          totalLent: grossYield,
          currency: "cKES",
          recentTransactions: [
            {
              id: 1,
              amount: usedForLoanRepayment,
              type: "interest",
              date: new Date().toISOString(),
              status: "completed",
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching earnings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarnings();
  }, [getYields]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col bg-background">
        <MiniPayHeader />
        <div className="container px-4 py-6 mx-auto space-y-6 max-w-md">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              Your Earnings
            </h1>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[100px] w-full rounded-lg" />
              <Skeleton className="h-[100px] w-full rounded-lg" />
              <Skeleton className="h-[250px] w-full rounded-lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Earned</CardTitle>
                    <CardDescription className="text-xs">
                      All time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      cKES {earnings.totalEarned.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total earnings from interest
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Lent</CardTitle>
                    <CardDescription className="text-xs">
                      Money in circulation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {earnings.currency} {earnings.totalLent.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your earnings history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {earnings.recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <div className="font-medium">Interest Earned</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                        </div>
                      </div>
                      <div className="font-bold text-green-600">
                        +{earnings.currency}{" "}
                        {transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {earnings.recentTransactions.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No earnings yet. Start lending to earn interest!
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
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
