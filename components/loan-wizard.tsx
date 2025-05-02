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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Check, CircleDollarSign, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type Step = "amount" | "repayment" | "confirmation";
type Currency = "USD" | "KES" | "EUR" | "GHS" | "NGN" | "XOF" | "PHP";

const exchangeRates: Record<Currency, number> = {
  USD: 1,
  KES: 140,
  EUR: 0.92,
  GHS: 12.5,
  NGN: 860,
  XOF: 604,
  PHP: 56.5,
};

interface LoanWizardProps {
  availableCredit: number;
  onSubmit: (data: any) => Promise<boolean>;
}

export function LoanWizard({ availableCredit, onSubmit }: LoanWizardProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState(100);
  const [savingsCurrency] = useState<Currency>("USD");
  // Get loan currency from MiniPay environment
  const [loanCurrency] = useState<Currency>("KES");
  const [term] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate loan amount in local currency
  const loanAmount =
    amount * (exchangeRates[loanCurrency] / exchangeRates[savingsCurrency]);
  const totalRepayment = loanAmount * 1.05; // 5% interest

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
        amountUSD: amount,
        amountLocal: loanAmount,
        savingsCurrency,
        localCurrency: loanCurrency,
        termDays: term,
      });

      if (success) {
        toast({
          title: "Processing Your Loan",
          description: "Your loan request is being processed in MiniPay.",
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
        <CardDescription>
          Use your savings as security to get quick money in your local currency
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === "amount" && (
          <>
            <div>
              <h3 className="text-sm font-medium mb-2">Security Amount</h3>
              <div className="flex items-center gap-2 mb-4">
                <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  Select the amount of savings to use as security
                </div>
              </div>
              <Slider
                value={[amount]}
                min={10}
                max={Math.min(availableCredit, 500)}
                step={10}
                onValueChange={(values) => setAmount(values[0])}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10 USD</span>
                <span>{Math.min(availableCredit, 500)} USD</span>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex justify-between mb-2">
                <span className="text-sm">You'll receive</span>
                <span className="text-sm font-bold">
                  {loanAmount.toFixed(2)} {loanCurrency}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Exchange rate: 1 USD ={" "}
                {(
                  exchangeRates[loanCurrency] / exchangeRates[savingsCurrency]
                ).toFixed(2)}{" "}
                {loanCurrency}
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
                        {(totalRepayment / 3).toFixed(2)} {loanCurrency}
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
                    Security Amount
                  </span>
                  <span className="text-sm font-medium">{amount} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    You'll receive
                  </span>
                  <span className="text-sm font-medium">
                    {loanAmount.toFixed(2)} {loanCurrency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Duration
                  </span>
                  <span className="text-sm font-medium">{term} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total to repay
                  </span>
                  <span className="text-sm font-medium">
                    {totalRepayment.toFixed(2)} {loanCurrency}
                  </span>
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
