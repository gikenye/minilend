"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { CreditRadar } from "@/components/credit-radar";
import { useLending } from "@/contexts/LendingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Step = "score" | "amount" | "repayment" | "confirmation";

interface LoanWizardProps {
  availableCredit: number;
  onSubmit: (data: any) => Promise<boolean>;
}

export function LoanWizard({ availableCredit, onSubmit }: LoanWizardProps) {
  const [step, setStep] = useState<Step>("score");
  const [amount, setAmount] = useState(1000);
  const [term] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditScore, setCreditScore] = useState<any>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(true);
  const { getCreditScore } = useLending();

  // 5% interest rate
  const totalRepayment = amount * 1.05;

  // Minimum required balance in USD to access a loan
  const MIN_REQUIRED_BALANCE = 5;
  
  // Check if user has enough funds to qualify for a loan
  const hasMinimumBalance = availableCredit >= 500; // Assuming 500 cKES ≈ 5 USD

  const fetchCreditScore = async () => {
    setIsLoadingScore(true);
    try {
      const score = await getCreditScore();
      setCreditScore(score);
    } catch (error) {
      console.error("Error loading credit score:", error);
      toast({
        title: "Error",
        description: "Could not load credit score. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingScore(false);
    }
  };

  useEffect(() => {
    fetchCreditScore();
  }, [getCreditScore]);

  const handleNext = () => {
    if (!hasMinimumBalance) {
      toast({
        title: "Not Eligible for Loan",
        description: "You need at least $5 USD in savings to qualify for a loan.",
        variant: "destructive",
      });
      return;
    }
    
    if (step === "score") {
      setStep("amount");
    } else if (step === "amount") {
      setStep("repayment");
    } else if (step === "repayment") {
      setStep("confirmation");
    }
  };

  const handleBack = () => {
    if (step === "amount") {
      setStep("score");
    } else if (step === "repayment") {
      setStep("amount");
    } else if (step === "confirmation") {
      setStep("repayment");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        amountLocal: amount,
        termDays: term,
      });
      if (success) {
        toast({
          title: "Processing Your Loan",
          description: "Your loan request is being processed.",
        });
      }
    } catch (error) {
      console.error("Error submitting loan:", error);
      toast({
        title: "Error",
        description: "Could not process your loan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate max loan amount based on credit score and available credit
  // If user doesn't have minimum balance, no loan is available
  const maxLoanAmount = hasMinimumBalance && creditScore
    ? Math.min(
        availableCredit,
        70000 * (creditScore.score / 1000) // Scale max amount by credit score
      )
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get an Instant Loan</CardTitle>
        <CardDescription>Get quick money based on your savings</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === "score" && (
          <>
            {isLoadingScore ? (
              <div className="space-y-4">
                <Skeleton className="h-[300px] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : creditScore ? (
              <>
                <div className="flex items-center justify-between">
                  <CreditRadar creditScore={creditScore} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchCreditScore}
                    className="absolute top-4 right-4"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh credit score</span>
                  </Button>
                </div>
                
                {!hasMinimumBalance ? (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need at least $5 USD in savings to qualify for a loan. Please add more funds to your account.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="text-sm text-muted-foreground mt-4">
                    Based on your credit score of {creditScore.score}, you can
                    borrow up to{" "}
                    <span className="font-medium">
                      cKES {Math.round(maxLoanAmount).toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Could not load credit score.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCreditScore}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}
          </>
        )}

        {step === "amount" && (
          <>
            <div>
              <h3 className="text-sm font-medium mb-2">Loan Amount</h3>
              <div className="flex items-center gap-2 mb-4">
                <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  Select how much you want to borrow
                </div>
              </div>
              <Slider
                value={[amount]}
                min={1000}
                max={maxLoanAmount}
                step={1000}
                onValueChange={(values) => setAmount(values[0])}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>cKES 1,000</span>
                <span>cKES {Math.round(maxLoanAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Total to repay</span>
                <span className="text-sm font-bold">
                  cKES {totalRepayment.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                5% interest rate over {term} days
              </div>
            </div>
          </>
        )}

        {step === "repayment" && (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Repayment Schedule</h3>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    Your loan will be split into 3 equal payments
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[1, 2, 3].map((payment) => (
                  <div
                    key={payment}
                    className={cn(
                      "flex items-center p-3 rounded-lg border",
                      payment === 1 ? "bg-muted/30" : ""
                    )}
                  >
                    <div className="mr-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        Payment {payment}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Due in {payment * Math.round(term / 3)} days
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        cKES {(totalRepayment / 3).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {step === "confirmation" && (
          <>
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-medium mb-3">Loan Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Loan Amount
                  </span>
                  <span className="text-sm font-medium">
                    cKES {amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total to repay
                  </span>
                  <span className="text-sm font-medium">
                    cKES {totalRepayment.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Duration
                  </span>
                  <span className="text-sm font-medium">{term} days</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {step !== "score" && (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        )}
        {step !== "confirmation" ? (
          <Button
            className={step === "score" ? "w-full" : "ml-auto"}
            onClick={handleNext}
            disabled={!hasMinimumBalance}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="ml-auto bg-green-600 hover:bg-green-700"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Processing..."
            ) : (
              <>
                Get Your Loan
                <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
