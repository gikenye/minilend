"use client";

import { useState, useEffect } from "react";
import { LoanDashboard } from "@/components/loan-dashboard";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

const DEMO_LOAN_ELIGIBILITY = {
  limit: 1250,
};

const DEMO_ACTIVE_LOANS = [
  {
    id: "loan_123",
    amountLocal: 500,
    localCurrency: "KES",
    termDays: 30,
    status: "active",
    repaymentSchedule: [
      { status: "paid" },
      { status: "paid" },
      { status: "pending" },
    ],
  },
];

export function Dashboard() {
  const { user } = useAuth();
  const [loanEligibility, setLoanEligibility] = useState(DEMO_LOAN_ELIGIBILITY);
  const [activeLoans, setActiveLoans] = useState(DEMO_ACTIVE_LOANS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto space-y-4 px-2 py-4 md:px-4 md:py-6">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      ) : (
        <LoanDashboard
          availableCredit={loanEligibility?.limit || 0}
          activeLoan={activeLoans[0] || null}
        />
      )}
    </div>
  );
}
