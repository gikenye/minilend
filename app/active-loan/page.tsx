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
import { useLending } from "@/contexts/LendingContext";
import { toast } from "@/components/ui/use-toast";

export default function ActiveLoanPage() {
  const { getUserLoan, repayLoan } = useLending();
  const [loan, setLoan] = useState<{
    active: boolean;
    principal: string;
    interestAccrued: string;
    lastUpdate: number;
    // Additional UI state
    paymentAmount?: number;
    paidPayments?: number;
    totalPayments?: number;
    nextPaymentDate?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        const loanData = await getUserLoan();
        if (loanData && loanData.active) {
          const principalAmount = Number(loanData.principal);
          const interestAmount = Number(loanData.interestAccrued);
          const totalAmount = principalAmount + interestAmount;
          const paymentPerInstallment = totalAmount / 3;

          // Calculate paid payments based on remaining principal
          const remainingPrincipal = principalAmount;
          const paidAmount = totalAmount - remainingPrincipal;
          const paidPayments = Math.floor((paidAmount / totalAmount) * 3);

          setLoan({
            ...loanData,
            paymentAmount: paymentPerInstallment,
            paidPayments,
            totalPayments: 3,
            nextPaymentDate: new Date(
              Number(loanData.lastUpdate) * 1000 + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          });

          setProgress((paidPayments / 3) * 100);
        }
      } catch (error) {
        console.error("Error fetching loan:", error);
        toast({
          title: "Error",
          description: "Could not fetch loan details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoanData();
  }, [getUserLoan]);

  const handleRepayment = async () => {
    try {
      if (!loan?.paymentAmount) {
        throw new Error("Payment amount not available");
      }
      const hash = await repayLoan(loan.paymentAmount.toString());
      toast({
        title: "Payment Processing",
        description: "Your payment is being processed. Transaction: " + hash,
      });
      // Refresh loan data
      const updatedLoan = await getUserLoan();
      if (updatedLoan) {
        setLoan((prevLoan) => ({
          ...updatedLoan,
          paymentAmount: prevLoan?.paymentAmount,
          paidPayments: (prevLoan?.paidPayments || 0) + 1,
          totalPayments: prevLoan?.totalPayments,
          nextPaymentDate: prevLoan?.nextPaymentDate,
        }));
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Could not process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!loan || !loan.active) {
    return (
      <main className="flex min-h-screen flex-col bg-background">
        <MiniPayHeader />
        <div className="container px-4 py-6 mx-auto space-y-6 max-w-md">
          <h1 className="text-2xl font-bold text-foreground">No Active Loan</h1>
          <p>You currently don't have any active loans.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <MiniPayHeader />
      <div className="container px-4 py-6 mx-auto space-y-6 max-w-md">
        <h1 className="text-2xl font-bold text-foreground">Current Loan</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Loan Overview</CardTitle>
            <CardDescription>Your active loan details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-bold">
                KES {Number(loan.principal).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Started on{" "}
                {formatDate(new Date(loan.lastUpdate * 1000).toISOString())}
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
                  KES {loan.paymentAmount?.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Payment Schedule</CardTitle>
            <CardDescription>Your repayment timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: loan.totalPayments || 0 }).map(
                (_, index) => {
                  const isPaid = index < (loan.paidPayments || 0);
                  const isNext = index === (loan.paidPayments || 0);

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
                            KES {loan.paymentAmount?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {isNext && (
                        <Button size="sm" onClick={() => handleRepayment()}>
                          Pay Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                }
              )}
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
