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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle, Home } from "lucide-react";
import { MiniPayHeader } from "@/components/mini-pay-header";
import { useWeb3 } from "@/contexts/useWeb3";
import { formatEther } from "viem";
import { KES_EXCHANGE_RATE } from "@/types/currencies";
import type { Log } from "viem";

interface LoanHistoryItem {
  id: string;
  amountLocal: number;
  localCurrency: string;
  termDays: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

interface LoanEvent extends Log {
  args: {
    user: `0x${string}`;
    token: `0x${string}`;
    amount: bigint;
  };
}

interface RepaymentEvent extends Log {
  args: {
    user: `0x${string}`;
    token: `0x${string}`;
    amount: bigint;
  };
}

export default function LoanHistoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loanHistory, setLoanHistory] = useState<LoanHistoryItem[]>([]);
  const { publicClient, address, getStableTokenBalance } = useWeb3();

  useEffect(() => {
    const fetchLoanHistory = async () => {
      if (!publicClient || !address || !address.startsWith("0x")) return;

      try {
        // Get all loans created by this user
        const loanEvents = (await publicClient.getLogs({
          event: {
            type: "event",
            name: "LoanCreated",
            inputs: [
              { indexed: true, type: "address", name: "user" },
              { indexed: true, type: "address", name: "token" },
              { indexed: false, type: "uint256", name: "amount" },
            ],
          },
          args: { user: address as `0x${string}` },
          fromBlock: BigInt(0),
          toBlock: "latest",
        })) as LoanEvent[];

        // Get all repayments by this user
        const repaymentEvents = (await publicClient.getLogs({
          event: {
            type: "event",
            name: "LoanRepaid",
            inputs: [
              { indexed: true, type: "address", name: "user" },
              { indexed: true, type: "address", name: "token" },
              { indexed: false, type: "uint256", name: "amount" },
            ],
          },
          args: { user: address as `0x${string}` },
          fromBlock: BigInt(0),
          toBlock: "latest",
        })) as RepaymentEvent[];

        // Process loan events into history items
        const history: LoanHistoryItem[] = loanEvents.map((event) => {
          // Find corresponding repayment event
          const repayment = repaymentEvents.find(
            (r) =>
              r.args?.user === event.args?.user &&
              r.args?.token === event.args?.token &&
              r.blockNumber &&
              event.blockNumber &&
              r.blockNumber > event.blockNumber
          );

          const loanAmount = Number(
            formatEther(event.args?.amount || BigInt(0))
          );

          return {
            id: `${event.blockNumber}-${event.args?.token}`,
            amountLocal: loanAmount * KES_EXCHANGE_RATE,
            localCurrency: "cKES",
            termDays: 30,
            status: repayment ? "completed" : "active",
            createdAt: new Date(Number(event.blockNumber) * 1000).toISOString(),
            completedAt:
              repayment && repayment.blockNumber
                ? new Date(Number(repayment.blockNumber) * 1000).toISOString()
                : null,
          };
        });

        setLoanHistory(history);
      } catch (error) {
        console.error("Error fetching loan history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoanHistory();
  }, [publicClient, address]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <MiniPayHeader />
      <div className="container px-4 py-6 mx-auto space-y-6 max-w-md">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Loan History</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go Back</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[100px] w-full rounded-lg" />
            <Skeleton className="h-[100px] w-full rounded-lg" />
            <Skeleton className="h-[100px] w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {loanHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No loan history found. Take your first loan to get started!
              </div>
            ) : (
              loanHistory.map((loan) => (
                <Card key={loan.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {loan.amountLocal.toLocaleString()} {loan.localCurrency}
                      {loan.status === "completed" && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(loan.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{loan.termDays} days</span>
                      </div>
                      {loan.completedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Completed On
                          </span>
                          <span>{formatDate(loan.completedAt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span
                          className={
                            loan.status === "completed"
                              ? "text-green-600"
                              : "text-blue-600"
                          }
                        >
                          {loan.status === "completed"
                            ? "Fully Repaid"
                            : "Active"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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
  );
}
