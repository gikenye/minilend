"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Check, CircleDollarSign, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

type Step = "amount" | "repayment" | "confirmation"
type Currency = "cUSD" | "cKES" | "cEUR" | "cReal" | "eXOF" | "PUSO" | "cCOP"

const exchangeRates: Record<Currency, number> = {
  cUSD: 1,
  cKES: 140,
  cEUR: 0.92,
  cReal: 5.1,
  eXOF: 604,
  PUSO: 56.5,
  cCOP: 3950,
}

interface LoanWizardProps {
  availableCredit: number
  onSubmit: (loanData: any) => Promise<boolean>
}

export function LoanWizard({ availableCredit, onSubmit }: LoanWizardProps) {
  const [step, setStep] = useState<Step>("amount")
  const [amount, setAmount] = useState(100)
  const [collateralCurrency, setCollateralCurrency] = useState<Currency>("cUSD")
  const [loanCurrency, setLoanCurrency] = useState<Currency>("cKES")
  const [term, setTerm] = useState<number>(30)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loanAmount = (amount * exchangeRates[loanCurrency]) / exchangeRates[collateralCurrency]
  const interestRate = 0.05 // 5% interest
  const totalRepayment = loanAmount * (1 + interestRate)

  const handleNext = () => {
    if (step === "amount") setStep("repayment")
    else if (step === "repayment") setStep("confirmation")
  }

  const handleBack = () => {
    if (step === "repayment") setStep("amount")
    else if (step === "confirmation") setStep("repayment")
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const loanData = {
        amountCUSD: amount,
        amountLocal: loanAmount,
        localCurrency: loanCurrency,
        termDays: term,
      }

      const success = await onSubmit(loanData)

      if (success) {
        toast({
          title: "Loan Approved",
          description: `Your loan of ${loanAmount.toFixed(2)} ${loanCurrency} has been approved!`,
          variant: "default",
        })

        // Reset form and go back to first step
        setAmount(100)
        setTerm(30)
        setStep("amount")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your loan application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Apply for a Loan</CardTitle>
        <CardDescription>Use your stablecoins as collateral</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {step === "amount" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Collateral Currency</h3>
                <Tabs
                  defaultValue={collateralCurrency}
                  onValueChange={(v) => setCollateralCurrency(v as Currency)}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 h-auto">
                    <TabsTrigger value="cUSD">cUSD</TabsTrigger>
                    <TabsTrigger value="cEUR">cEUR</TabsTrigger>
                    <TabsTrigger value="cReal">cReal</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Loan Currency</h3>
                <Tabs
                  defaultValue={loanCurrency}
                  onValueChange={(v) => setLoanCurrency(v as Currency)}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 h-auto">
                    <TabsTrigger value="cKES">cKES</TabsTrigger>
                    <TabsTrigger value="PUSO">PUSO</TabsTrigger>
                    <TabsTrigger value="eXOF">eXOF</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">Collateral Amount</h3>
                  <span className="text-sm font-medium">
                    {amount} {collateralCurrency}
                  </span>
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
                  <span>10 {collateralCurrency}</span>
                  <span>
                    {Math.min(availableCredit, 500)} {collateralCurrency}
                  </span>
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
                  Exchange rate: 1 {collateralCurrency} ={" "}
                  {(exchangeRates[loanCurrency] / exchangeRates[collateralCurrency]).toFixed(2)} {loanCurrency}
                </div>
              </div>
            </div>
          )}

          {step === "repayment" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">Loan Term (days)</h3>
                  <span className="text-sm font-medium">{term} days</span>
                </div>
                <Slider
                  value={[term]}
                  min={7}
                  max={90}
                  step={1}
                  onValueChange={(values) => setTerm(values[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>7 days</span>
                  <span>90 days</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Repayment Schedule</h3>
                <div className="space-y-2">
                  {[1, 2, 3].map((payment) => (
                    <div
                      key={payment}
                      className={cn("flex items-center p-3 rounded-lg border", payment === 1 ? "bg-muted/30" : "")}
                    >
                      <div className="mr-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Payment {payment}</div>
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

              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Loan amount</span>
                  <span className="text-sm">
                    {loanAmount.toFixed(2)} {loanCurrency}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Interest (5%)</span>
                  <span className="text-sm">
                    {(loanAmount * interestRate).toFixed(2)} {loanCurrency}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t mt-2">
                  <span className="text-sm font-medium">Total repayment</span>
                  <span className="text-sm font-bold">
                    {totalRepayment.toFixed(2)} {loanCurrency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === "confirmation" && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-medium mb-3">Loan Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Collateral</span>
                    <span className="text-sm font-medium">
                      {amount} {collateralCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Loan amount</span>
                    <span className="text-sm font-medium">
                      {loanAmount.toFixed(2)} {loanCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Term</span>
                    <span className="text-sm font-medium">{term} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Interest rate</span>
                    <span className="text-sm font-medium">5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total repayment</span>
                    <span className="text-sm font-medium">
                      {totalRepayment.toFixed(2)} {loanCurrency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-muted/30">
                <h3 className="text-sm font-medium mb-2">Terms & Conditions</h3>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Your collateral will be locked until full repayment</li>
                  <li>• Early repayment is allowed with no penalties</li>
                  <li>• Late payments incur a 1% daily fee</li>
                  <li>• If loan is not repaid within 7 days after due date, collateral may be liquidated</li>
                </ul>
              </div>

              <div
                className={cn(
                  "rounded-lg p-4 border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50",
                )}
              >
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    <CircleDollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Instant Approval</h4>
                    <p className="text-xs mt-1">
                      Your loan is pre-approved based on your MiniPay activity and credit score.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {step !== "amount" ? (
          <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
            Back
          </Button>
        ) : (
          <div></div>
        )}

        {step !== "confirmation" ? (
          <Button onClick={handleNext}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>Processing...</>
            ) : (
              <>
                Confirm Loan <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
