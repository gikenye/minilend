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
import { Home, Clock, CheckCircle, ArrowRight } from "lucide-react";

const DEMO_LOAN = {
  amountLocal: 50000,
  localCurrency: "KES",
  termDays: 30,
  startDate: "2025-04-15",
  nextPaymentDate: "2025-05-15",
  totalPayments: 3,
  paidPayments: 1,
  paymentAmount: 17500, // 50000 + 5% interest / 3 payments
  status: "active",
};

export default function ActiveLoanPage() {
  const [loan, setLoan] = useState(DEMO_LOAN);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const paidProgress = (loan.paidPayments / loan.totalPayments) * 100;
    setProgress(paidProgress);
  }, [loan]);

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
        <h1 className="text-2xl font-bold text-foreground">Current Loan</h1>

        {/* Loan Overview Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Loan Overview</CardTitle>
            <CardDescription>Your active loan details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">
                {loan.localCurrency} {loan.amountLocal.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Started on {formatDate(loan.startDate)}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Repayment Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Next Payment
                </div>
                <div className="font-medium">
                  {formatDate(loan.nextPaymentDate)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Amount Due</div>
                <div className="font-medium">
                  {loan.localCurrency} {loan.paymentAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Schedule Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Schedule</CardTitle>
            <CardDescription>Your repayment timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: loan.totalPayments }).map((_, index) => {
                const isPaid = index < loan.paidPayments;
                const isNext = index === loan.paidPayments;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isNext ? "bg-muted/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isPaid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">Payment {index + 1}</div>
                        <div className="text-sm text-muted-foreground">
                          {loan.localCurrency}{" "}
                          {loan.paymentAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {isNext && (
                      <Button size="sm">
                        Pay Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
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
