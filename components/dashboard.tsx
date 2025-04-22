"use client"

import { useState, useEffect } from "react"
import { LoanDashboard } from "@/components/loan-dashboard"
import { LoanWizard } from "@/components/loan-wizard"
import { CreditRadar } from "@/components/credit-radar"
import { CeloWallet } from "@/components/celo-wallet"
import { MiniPayHeader } from "@/components/mini-pay-header"
import { LocaleToggle } from "@/components/locale-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import { useRouter } from "next/navigation"

// Dummy data for demo
const DUMMY_CREDIT_SCORE = {
  score: 720,
  breakdown: {
    repaymentHistory: 0.85,
    transactionFrequency: 0.7,
    socialConnections: 0.9,
    accountAge: 0.5,
    savingsPattern: 0.6,
  },
}

const DUMMY_LOAN_ELIGIBILITY = {
  limit: 1250,
  factors: {
    baseLimit: 1000,
    creditAdjustment: 250,
    transactionVolume: 1500,
    creditScore: 720,
    maxLimit: 2000,
  },
}

const DUMMY_ACTIVE_LOANS = [
  {
    id: "loan_123",
    amountLocal: 500,
    localCurrency: "cKES",
    termDays: 30,
    status: "active",
    repaymentSchedule: [{ status: "paid" }, { status: "paid" }, { status: "pending" }],
  },
]

export function Dashboard() {
  const { user } = useAuth()
  const [creditScore, setCreditScore] = useState(DUMMY_CREDIT_SCORE)
  const [loanEligibility, setLoanEligibility] = useState(DUMMY_LOAN_ELIGIBILITY)
  const [activeLoans, setActiveLoans] = useState(DUMMY_ACTIVE_LOANS)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simulate loading for demo
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleLoanSubmit = async (loanData: any) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Loan Approved",
        description: `Your loan of ${loanData.amountLocal.toFixed(2)} ${loanData.localCurrency} has been approved!`,
      })

      // Add the new loan to active loans
      setActiveLoans([
        ...activeLoans,
        {
          id: `loan_${Date.now()}`,
          amountLocal: loanData.amountLocal,
          localCurrency: loanData.localCurrency,
          termDays: loanData.termDays,
          status: "active",
          repaymentSchedule: [{ status: "pending" }, { status: "pending" }, { status: "pending" }],
        },
      ])

      return true
    } catch (error) {
      console.error("Error submitting loan:", error)
      toast({
        title: "Error",
        description: "Failed to process loan application",
        variant: "destructive",
      })
      return false
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <MiniPayHeader />
      <div className="container px-4 py-6 mx-auto space-y-8 max-w-md">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">MiniLend</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push("/loan-history")} title="Loan History">
              <History className="h-5 w-5" />
              <span className="sr-only">Loan History</span>
            </Button>
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        ) : (
          <>
            <LoanDashboard availableCredit={loanEligibility?.limit || 0} activeLoan={activeLoans[0] || null} />
            <CeloWallet />
            <CreditRadar creditScore={creditScore} />
            <LoanWizard availableCredit={loanEligibility?.limit || 0} onSubmit={handleLoanSubmit} />
          </>
        )}
      </div>
    </main>
  )
}
