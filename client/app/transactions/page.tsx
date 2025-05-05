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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Home, Clock } from "lucide-react";
import { MiniPayHeader } from "@/components/mini-pay-header";
import { apiClient } from "@/lib/api-client";
import { CKES_EXCHANGE_RATE } from "@/types/currencies";
import ProtectedRoute from "@/components/protected-route";

interface Transaction {
  id: string;
  type: "loan" | "repayment" | "deposit" | "withdrawal";
  amount: number;
  status: "completed" | "pending" | "failed";
  timestamp: string;
  description: string;
}

interface TransactionSummary {
  totalTransactions: number;
  totalVolume: number;
  activeTransactions: number;
  recentActivity: {
    timestamp: string;
    type: string;
    amount: number;
  }[];
}

export default function TransactionsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);

  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        const [historyData, summaryData] = await Promise.all([
          apiClient.getTransactionHistory(),
          apiClient.getTransactionSummary(),
        ]);

        setTransactions(historyData);
        setSummary(summaryData);
      } catch (error) {
        console.error("Error fetching transaction data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col bg-background">
        <MiniPayHeader />
        <div className="container px-4 py-6 mx-auto space-y-6 max-w-4xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
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
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </div>
          ) : (
            <>
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        cKES{" "}
                        {(
                          summary.totalVolume * CKES_EXCHANGE_RATE
                        ).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {summary.totalTransactions} transactions
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Active Transactions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {summary.activeTransactions}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Currently in progress
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {summary.recentActivity
                        .slice(0, 2)
                        .map((activity, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <div className="text-sm">{activity.type}</div>
                            <div className="text-sm font-medium">
                              cKES{" "}
                              {(
                                activity.amount * CKES_EXCHANGE_RATE
                              ).toLocaleString()}
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Your recent financial activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>{formatDate(tx.timestamp)}</TableCell>
                              <TableCell className="capitalize">
                                {tx.type}
                              </TableCell>
                              <TableCell>{tx.description}</TableCell>
                              <TableCell>
                                cKES{" "}
                                {(
                                  tx.amount * CKES_EXCHANGE_RATE
                                ).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <span className={getStatusColor(tx.status)}>
                                  {tx.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
