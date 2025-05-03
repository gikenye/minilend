"use client";

import { useState } from "react";
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
import { ArrowRight, Check, CircleDollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Step = "amount" | "repayment" | "confirmation";

interface LoanWizardProps {
  availableCredit: number;
  onSubmit: (data: any) => Promise<boolean>;
}

export function LoanWizard({ availableCredit, onSubmit }: LoanWizardProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState(1000);
  const [term] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 5% interest rate
  const totalRepayment = amount * 1.05;

  const handleNext = () => {
    if (step === "amount") {
      setStep("repayment");
    } else if (step === "repayment") {
      setStep("confirmation");
    }
  };

  const handleBack = () => {
    if (step === "repayment") {
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
        localCurrency: "KES",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Get an Instant Loan</CardTitle>
        <CardDescription>Get quick money based on your savings</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
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
                max={Math.min(availableCredit, 70000)}
                step={1000}
                onValueChange={(values) => setAmount(values[0])}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>KES 1,000</span>
                <span>
                  KES {Math.min(availableCredit, 70000).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Total to repay</span>
                <span className="text-sm font-bold">
                  KES {totalRepayment.toLocaleString()}
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
                        KES {(totalRepayment / 3).toLocaleString()}
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
                    KES {amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total to repay
                  </span>
                  <span className="text-sm font-medium">
                    KES {totalRepayment.toLocaleString()}
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
        {step !== "amount" && (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        )}
        {step !== "confirmation" ? (
          <Button className="ml-auto" onClick={handleNext}>
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
