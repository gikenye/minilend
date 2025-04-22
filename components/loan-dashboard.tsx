"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { CircleDollarSign, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoanDashboardProps {
  availableCredit: number
  activeLoan: any | null
}

export function LoanDashboard({ availableCredit, activeLoan }: LoanDashboardProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (activeLoan) {
      const paidPayments = activeLoan.repaymentSchedule.filter((p: any) => p.status === "paid").length
      const totalPayments = activeLoan.repaymentSchedule.length
      const calculatedProgress = Math.round((paidPayments / totalPayments) * 100)

      const timer = setTimeout(() => setProgress(calculatedProgress), 500)
      return () => clearTimeout(timer)
    } else {
      setProgress(0)
    }
  }, [activeLoan])

  // Exchange rates for conversion (in a real app, these would come from an API)
  const exchangeRates: Record<string, number> = {
    cUSD: 1,
    cKES: 140,
    cEUR: 0.92,
    cReal: 5.1,
    eXOF: 604,
    PUSO: 56.5,
    cCOP: 3950,
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Available Credit</CardTitle>
          <CardDescription>Based on your 30-day transaction volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{availableCredit} cUSD</div>
              <div className="text-xs text-muted-foreground">
                ≈ {Math.round(availableCredit * exchangeRates.cKES)} cKES
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeLoan ? (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Loan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {activeLoan.amountLocal} {activeLoan.localCurrency}
              </div>
              <div className="text-xs text-muted-foreground">Due in {activeLoan.termDays} days</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Repayment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {activeLoan.repaymentSchedule.filter((p: any) => p.status === "paid").length} of{" "}
                {activeLoan.repaymentSchedule.length} payments
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className={cn("border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Quick Loan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              You qualify for an instant loan of up to{" "}
              <span className="font-bold">{Math.round(availableCredit * exchangeRates.cKES)} cKES</span> with your cUSD
              collateral.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
