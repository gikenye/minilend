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
import { ArrowRight, Home, TrendingUp, CircleDollarSign, AlertCircle, ArrowClockwise, CalendarClock } from "lucide-react";
import { useLending } from "@/contexts/LendingContext";
import { useWeb3 } from "@/contexts/useWeb3";
import { CKES_EXCHANGE_RATE } from "@/types/currencies";
import ProtectedRoute from "@/components/protected-route";
import { executeWithRpcFallback, resetRpcConnection } from "@/lib/blockchain-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RecentTransaction {
  id: number;
  amount: number;
  type: string;
  date: string;
  status: string;
}

export default function EarningsPage() {
  const { getYields } = useLending();
  const { publicClient, address } = useWeb3();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    activeLoans: 0,
    totalLent: 0,
    currency: "cKES",
    recentTransactions: [] as RecentTransaction[],
    lastUpdated: new Date()
  });

  const fetchEarnings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Reset RPC connection before fetching to ensure optimal connectivity
      resetRpcConnection();

      // Use our RPC fallback mechanism for resilience
      await executeWithRpcFallback(async () => {
        const yields = await getYields();

        // If we're here, we have successfully retrieved data
        // Convert yields to local currency
        const grossYield = Number(yields.grossYield) / 1e18 * CKES_EXCHANGE_RATE;
        const netYield = Number(yields.netYield) / 1e18 * CKES_EXCHANGE_RATE;
        const usedForLoanRepayment =
          Number(yields.usedForLoanRepayment) / 1e18 * CKES_EXCHANGE_RATE;

        // Get recent deposit events for more accurate transaction history
        let recentTransactions: RecentTransaction[] = [];
        if (publicClient && address) {
          try {
            const depositEvents = await publicClient.getLogs({
              address: "0x164E90869634ADd3891BBfB8d410B0742f899826" as `0x${string}`,
              event: {
                type: "event",
                name: "Deposit",
                inputs: [
                  { indexed: true, type: "address", name: "user" },
                  { indexed: true, type: "address", name: "token" },
                  { indexed: false, type: "uint256", name: "amount" }
                ]
              },
              args: { user: address },
              fromBlock: BigInt(0),
              toBlock: "latest"
            });

            // Convert deposit events to transactions
            recentTransactions = depositEvents.map((event, index) => ({
              id: index + 1,
              amount: usedForLoanRepayment > 0 ? usedForLoanRepayment / depositEvents.length : 0,
              type: "interest",
              date: new Date().toISOString(), // We don't have actual timestamps, so use current date
              status: "completed"
            }));
          } catch (eventsError) {
            console.error("Error fetching events:", eventsError);
            // If we can't get events, just use the single transaction
            if (usedForLoanRepayment > 0) {
              recentTransactions = [
                {
                  id: 1,
                  amount: usedForLoanRepayment,
                  type: "interest",
                  date: new Date().toISOString(),
                  status: "completed",
                },
              ];
            }
          }
        }

        setEarnings({
          totalEarned: netYield,
          activeLoans: grossYield > 0 ? 1 : 0, // If gross yield > 0, we have active loans
          totalLent: grossYield,
          currency: "cKES",
          recentTransactions: recentTransactions,
          lastUpdated: new Date()
        });
        
        return yields;
      });
    } catch (error: any) {
      console.error("Error fetching earnings:", error);
      setError(error?.message || "Failed to load your earnings data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
    
    // Set up auto-refresh every 60 seconds
    const refreshInterval = setInterval(fetchEarnings, 60000);
    return () => clearInterval(refreshInterval);
  }, [getYields, address]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleRefresh = () => {
    fetchEarnings();
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
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <ArrowClockwise className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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
                      {earnings.currency} {earnings.totalEarned.toLocaleString(undefined, {maximumFractionDigits: 2})}
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
                      {earnings.currency} {earnings.totalLent.toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Your contributions
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your earnings history</CardDescription>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <CalendarClock className="h-3 w-3 mr-1" />
                    Last updated: {earnings.lastUpdated.toLocaleTimeString()}
                  </div>
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
                        {transaction.amount.toLocaleString(undefined, {maximumFractionDigits: 2})}
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
