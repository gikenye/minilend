"use client";

import { useState, useEffect } from "react";
import { LoanDashboard } from "@/components/loan-dashboard";
import { useAuth } from "@/contexts/auth-context";
import { useLending } from "@/contexts/LendingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3 } from "@/contexts/useWeb3";
import { DEFAULT_CURRENCY } from "@/types/currencies";

interface ActiveLoan {
  id: string;
  amountLocal: number;
  localCurrency: string;
  termDays: number;
  status: string;
  repaymentSchedule: { status: string }[];
}

export function Dashboard() {
  const { user } = useAuth();
  const { getWithdrawable, getUserLoan } = useLending();
  const { getStableTokenBalance } = useWeb3();
  const [loanLimit, setLoanLimit] = useState(0);
  const [activeLoan, setActiveLoan] = useState<ActiveLoan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add individual error handling for each promise
        let balance = "0";
        let withdrawable = { withdrawable: "0" };
        let loanData = null;
        
        try {
          balance = await getStableTokenBalance(DEFAULT_CURRENCY);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
        
        try {
          withdrawable = await getWithdrawable();
        } catch (error) {
          console.error("Error fetching withdrawable:", error);
        }
        
        try {
          loanData = await getUserLoan();
        } catch (error) {
          console.error("Error fetching loan data:", error);
        }

        // Set loan limit as 50% of withdrawable balance
        setLoanLimit(Number(withdrawable.withdrawable) * 0.5);

        // Format loan data if active
        if (loanData && loanData.active) {
          setActiveLoan({
            id: "current",
            amountLocal: Number(loanData.principal),
            localCurrency: "cKES",
            termDays: 30,
            status: "active",
            repaymentSchedule: [
              { status: Number(loanData.principal) === 0 ? "paid" : "pending" },
            ],
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [user, getStableTokenBalance, getWithdrawable, getUserLoan]);

  return (
    <div className="container mx-auto space-y-4 px-2 py-4 md:px-4 md:py-6">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      ) : (
        <>
          <LoanDashboard availableCredit={loanLimit} activeLoan={activeLoan} />
        </>
      )}
    </div>
  );
}
