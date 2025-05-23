"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  Wallet,
  Plus,
  Clock,
  History,
  Info,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useWeb3 } from "@/contexts/useWeb3";
import { useLending } from "@/contexts/LendingContext";
import { CKES_EXCHANGE_RATE, DEFAULT_CURRENCY } from "@/types/currencies";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { MiniPayDeposit } from "@/components/minipay-deposit";
import { LendingDeposit } from "@/components/lending-deposit";

interface LoanDashboardProps {
  availableCredit: number;
  activeLoan?: {
    amountLocal: number;
    localCurrency: string;
    termDays: number;
    repaymentSchedule: any[];
  } | null;
}

export function LoanDashboard({
  availableCredit,
  activeLoan,
}: LoanDashboardProps) {
  const [progress, setProgress] = useState(0);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [showLendDialog, setShowLendDialog] = useState(false);
  const [estimatedFees, setEstimatedFees] = useState("0");
  const [isLending, setIsLending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { getStableTokenBalance, publicClient, address } = useWeb3();
  const { getWithdrawable, getUserLoan, deposit, getYields } = useLending();
  const [balance, setBalance] = useState<string>("0");
  const [withdrawable, setWithdrawable] = useState<string>("0");
  const [currentLoan, setCurrentLoan] = useState(activeLoan);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [yields, setYields] = useState({ netYield: "0", grossYield: "0", usedForLoanRepayment: "0" });

  const fetchBalances = async () => {
    try {
      const [balanceResult, withdrawableResult, loanResult, yieldsResult] = await Promise.all([
        getStableTokenBalance(DEFAULT_CURRENCY),
        getWithdrawable(),
        getUserLoan(),
        getYields(),
      ]);

      setBalance(balanceResult);
      setWithdrawable(withdrawableResult.withdrawable);
      setYields(yieldsResult);

      if (loanResult && loanResult.active) {
        const principal = Number(loanResult.principal);
        const interest = Number(loanResult.interestAccrued);
        const total = principal + interest;

        // Calculate progress based on remaining principal
        const progressPercent = ((total - principal) / total) * 100;
        setProgress(Math.min(progressPercent, 100));

        setCurrentLoan({
          amountLocal: principal,
          localCurrency: "cKES",
          termDays: 30,
          repaymentSchedule: [],
        });
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [getStableTokenBalance, getWithdrawable, getUserLoan, getYields]);

  const handleDeposit = async () => {
    if (!depositAmount) return;

    setIsDepositing(true);
    try {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

      const hash = await deposit(DEFAULT_CURRENCY, amount.toString());

      toast({
        title: "Deposit Processing",
        description: "Your deposit is being processed. Transaction: " + hash,
      });

      // Wait for transaction confirmation
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      if (receipt?.status === "success") {
        toast({
          title: "Success!",
          description: "Your money has been added to the lending pool",
        });
        router.push("/earnings"); // Redirect to earnings page
      }

      // Refresh balances after deposit
      await fetchBalances();
      setDepositAmount("");
      setShowLendDialog(false);
    } catch (error: any) {
      console.error("Error making deposit:", error);
      toast({
        title: "Error",
        description: error.message || "Could not process your deposit",
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const estimateTransactionFees = async () => {
    if (!publicClient || !address) return "0";

    try {
      const transaction = {
        to: address as `0x${string}`,
        value: BigInt(0),
        data: "0x" as `0x${string}`,
      };

      const gasLimit = await publicClient.estimateGas({
        ...transaction,
        account: address as `0x${string}`,
      });

      const gasPrice = await publicClient.getGasPrice();
      const fees = (gasLimit * gasPrice).toString();
      return fees;
    } catch (error) {
      console.error("Error estimating fees:", error);
      return "0";
    }
  };

  const estimateDepositFees = async () => {
    if (!depositAmount) return;
    try {
      const fees = await estimateTransactionFees();
      setEstimatedFees(fees);
    } catch (error) {
      console.error("Error estimating fees:", error);
    }
  };

  const handleLend = () => {
    if (!balance || Number(balance) === 0) {
      toast({
        title: "Cannot Lend",
        description: "You must have funds in your wallet to lend. Please deposit funds first.",
        variant: "destructive",
      });
      return;
    }

    // Show the lending dialog
    setShowLendDialog(true);
  };

  const handleAddMoney = () => {
    if (window?.ethereum?.isMiniPay) {
      // Show a dialog for quick MiniPay deposit
      setShowDepositDialog(true);
    } else {
      // Redirect to deposit page for non-MiniPay users
      router.push("/deposit");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Loan Limit</CardTitle>
              <CardDescription>Based on your savings balance</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddMoney}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Money
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">
                cKES{" "}
                {(Number(withdrawable) * CKES_EXCHANGE_RATE).toLocaleString()}
              </div>
            </div>
          </div>
          <Button
            className="w-full mt-4 bg-green-600 hover:bg-green-700"
            onClick={handleLend}
            disabled={Number(balance) === 0}
          >
            {isLending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Lend Money to Others
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Money to Your Account</DialogTitle>
            <DialogDescription>
              Choose from your available assets to deposit into the lending pool
            </DialogDescription>
          </DialogHeader>
          
          <MiniPayDeposit 
            onDepositComplete={() => {
              fetchBalances();
              setShowDepositDialog(false);
              toast({
                title: "Balance Updated",
                description: "Your deposit has been added to your account and is now earning interest.",
              });
            }} 
          />
          
        </DialogContent>
      </Dialog>

      {/* Lending Dialog */}
      <Dialog open={showLendDialog} onOpenChange={setShowLendDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lend Money to the Community</DialogTitle>
            <DialogDescription>
              Contribute to the lending pool and earn interest on your funds
            </DialogDescription>
          </DialogHeader>
          
          <LendingDeposit 
            onLendingComplete={() => {
              fetchBalances();
              setShowLendDialog(false);
            }}
            availableBalance={balance}
          />
          
        </DialogContent>
      </Dialog>

      <h2 className="text-lg font-semibold text-foreground mt-6 mb-2 text-center">
        What do you wanna do today?
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {currentLoan && (
          <Card
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => router.push("/active-loan")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current Loan</CardTitle>
              <CardDescription className="text-xs">
                Active loan details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold">
                cKES {currentLoan.amountLocal.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Due in {currentLoan.termDays} days
              </div>
            </CardContent>
          </Card>
        )}

        <Card
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => router.push("/apply-loan")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Get Money
            </CardTitle>
            <CardDescription className="text-xs">
              Quick loan based on savings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentLoan ? (
              <>
                <Progress value={progress} className="h-2" />
                <div className="mt-2 text-xs text-muted-foreground">
                  {Math.round(progress)}% repaid
                </div>
              </>
            ) : Number(withdrawable) < 10 ? (
              <div className="text-xs text-red-500">
                Need at least $5 USD in savings to qualify
              </div>
            ) : (
              <div className="text-sm">
                Up to{" "}
                <span className="font-bold">
                  cKES{" "}
                  {(
                    Number(withdrawable) *
                    CKES_EXCHANGE_RATE *
                    0.5
                  ).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => router.push("/withdraw")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cash Out</CardTitle>
            <CardDescription className="text-xs">
              Send to M-PESA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <span className="font-bold">
                cKES{" "}
                {(Number(withdrawable) * CKES_EXCHANGE_RATE).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => router.push("/earnings")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Your Rewards</CardTitle>
            <CardDescription className="text-xs">Earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <span className="font-bold text-green-600">
                cKES{" "}
                {(Number(yields.netYield) * CKES_EXCHANGE_RATE).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => router.push("/loan-history")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Loan History
            </CardTitle>
            <CardDescription className="text-xs">
              View past transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {currentLoan ? (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Active loan in progress
                </div>
              ) : (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  View all transactions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
