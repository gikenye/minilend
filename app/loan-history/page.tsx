"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, CheckCircle, Clock } from "lucide-react"
import { MiniPayHeader } from "@/components/mini-pay-header"

// Dummy loan history data
const DUMMY_LOAN_HISTORY = [
  {
    id: "loan_001",
    amountLocal: 750,
    localCurrency: "cKES",
    termDays: 30,
    status: "completed",
    createdAt: "2023-03-15T10:30:00Z",
    completedAt: "2023-04-14T16:45:00Z",
  },
  {
    id: "loan_002",
    amountLocal: 500,
    localCurrency: "cKES",
    termDays: 30,
    status: "completed",
    createdAt: "2023-04-20T14:15:00Z",
    completedAt: "2023-05-19T11:30:00Z",
  },
  {
    id: "loan_123",
    amountLocal: 500,
    localCurrency: "cKES",
    termDays: 30,
    status: "active",
    createdAt: "2023-05-10T09:45:00Z",
    completedAt: null,
  },
]

export default function LoanHistoryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [loanHistory, setLoanHistory] = useState(DUMMY_LOAN_HISTORY)

  useEffect(() => {
    // Simulate loading for demo
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <MiniPayHeader />
      <div className="container px-4 py-6 mx-auto space-y-6 max-w-md">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Loan History</h1>
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
              <Card key={loan.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {loan.amountLocal} {loan.localCurrency}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {loan.status === "active" ? (
                        <Clock className="h-4 w-4 text-amber-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className={loan.status === "active" ? "text-amber-500" : "text-green-500"}>
                        {loan.status === "active" ? "Active" : "Completed"}
                      </span>
                    </div>
                  </div>
                  <CardDescription>
                    {loan.termDays} day term • Started {formatDate(loan.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-sm text-muted-foreground">
                    {loan.status === "completed" ? (
                      <span>Completed on {formatDate(loan.completedAt!)}</span>
                    ) : (
                      <span>In progress</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
