"use client";

import { LoanWizard } from "@/components/loan-wizard";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function ApplyLoanPage() {
  const handleLoanSubmit = async (loanData: any) => {
    // Simulate loan submission logic
    console.log("Loan submitted:", loanData);
    return true;
  };

  return (
    <div className="container mx-auto p-4 pb-20 relative">
      <LoanWizard availableCredit={500} onSubmit={handleLoanSubmit} />

      {/* Fixed Home Button */}
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
