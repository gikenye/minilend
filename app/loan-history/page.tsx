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
import { ArrowLeft, CheckCircle, Clock, Home } from "lucide-react";
import { MiniPayHeader } from "@/components/mini-pay-header";

// Example loan history data
const DEMO_LOAN_HISTORY = [
  {
    id: "loan_001",
    amountLocal: 750,
    localCurrency: "KES",
    termDays: 30,
    status: "completed",
    createdAt: "2023-03-15T10:30:00Z",
    completedAt: "2023-04-14T16:45:00Z",
  },
  {
    id: "loan_002",
    amountLocal: 500,
    localCurrency: "KES",
    termDays: 30,
    status: "completed",
    createdAt: "2023-02-01T08:15:00Z",
    completedAt: "2023-03-03T14:20:00Z",
  },
  {
    id: "loan_003",
    amountLocal: 1000,
    localCurrency: "KES",
    termDays: 30,
    status: "completed",
    createdAt: "2023-01-15T16:45:00Z",
    completedAt: "2023-02-14T11:30:00Z",
  },
];

export default function LoanHistoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loanHistory, setLoanHistory] = useState(DEMO_LOAN_HISTORY);

  useEffect(() => {
    // Simulate loading for demo
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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
            {loanHistory.map((loan) => (
              <Card key={loan.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {loan.amountLocal} {loan.localCurrency}
                    <CheckCircle className="h-5 w-5 text-green-500" />
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Completed On
                      </span>
                      <span>{formatDate(loan.completedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-green-600 font-medium">
                        Fully Repaid
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Home Button */}
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
