"use client";

import { LoanWizard } from "@/components/loan-wizard";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useLending } from "@/contexts/LendingContext";
import { toast } from "@/components/ui/use-toast";
import { useWeb3 } from "@/contexts/useWeb3";
import { useState, useEffect } from "react";
import { DEFAULT_CURRENCY } from "@/types/currencies";

export default function ApplyLoanPage() {
  const { borrow } = useLending();
  const { getStableTokenBalance } = useWeb3();
  const [availableCredit, setAvailableCredit] = useState(0);

  useEffect(() => {
    const fetchAvailableCredit = async () => {
      try {
        const balance = await getStableTokenBalance(DEFAULT_CURRENCY);
        // Available credit is 50% of savings balance
        setAvailableCredit(Number(balance) * 0.5);
      } catch (error) {
        console.error("Error fetching available credit:", error);
        toast({
          title: "Error",
          description: "Could not fetch available credit",
          variant: "destructive",
        });
      }
    };
    fetchAvailableCredit();
  }, [getStableTokenBalance]);

  const handleLoanSubmit = async (loanData: any) => {
    try {
      const hash = await borrow(loanData.amountLocal.toString());
      toast({
        title: "Loan Processing",
        description:
          "Your loan request is being processed. Transaction: " + hash,
      });
      return true;
    } catch (error) {
      console.error("Error processing loan:", error);
      toast({
        title: "Error",
        description: "Could not process your loan. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <div className="container mx-auto p-4 pb-20 relative">
      <LoanWizard
        availableCredit={availableCredit}
        onSubmit={handleLoanSubmit}
      />

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
    </div>
  );
}
