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

// Sample earnings data for demonstration
const DEMO_EARNINGS_DATA = {
  totalEarned: 450,
  activeLoans: 3,
  totalLent: 2000,
  currency: "KES",
  recentTransactions: [
    {
      id: 1,
      amount: 150,
      type: "interest",
      date: "2025-05-01",
      status: "completed",
    },
    {
      id: 2,
      amount: 200,
      type: "interest",
      date: "2025-04-28",
      status: "completed",
    },
    {
      id: 3,
      amount: 100,
      type: "interest",
      date: "2025-04-25",
      status: "completed",
    },
  ],
};

export default function EarningsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState(DEMO_EARNINGS_DATA);
  const [moneyInUse, setMoneyInUse] = useState(75); // Percentage of money being used for loans

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
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <MiniPayHeader />
      <div className="container px-4 py-6 mx-auto space-y-6 max-w-md">
        <h1 className="text-2xl font-bold text-foreground">Your Earnings</h1>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[150px] w-full rounded-lg" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        ) : (
          <>
            {/* Total Earnings Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Total Money Earned
                </CardTitle>
                <CardDescription>
                  Money you've earned by helping others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {earnings.totalEarned} {earnings.currency}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  From helping {earnings.activeLoans} people with loans
                </div>
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Activity Summary</CardTitle>
                <CardDescription>
                  How your money is helping others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Money Currently In Use</span>
                    <span>{moneyInUse}%</span>
                  </div>
                  <Progress value={moneyInUse} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Money Lent
                    </div>
                    <div className="text-lg font-bold">
                      {earnings.totalLent} {earnings.currency}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Yearly Returns
                    </div>
                    <div className="text-lg font-bold text-green-600">15%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Earnings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Earnings</CardTitle>
                <CardDescription>Money you've earned recently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earnings.recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-start gap-3">
                        <CircleDollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <div className="font-medium">
                            Earned {transaction.amount} {earnings.currency}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(transaction.date)}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
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
