"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useWeb3 } from "@/contexts/useWeb3";
import { useLending } from "@/contexts/LendingContext";
import { KES_EXCHANGE_RATE, DEFAULT_CURRENCY } from "@/types/currencies";

interface AccountBalance {
  totalSavings: string;
  availableForWithdraw: string;
}

export function SavingsAccount() {
  const { user } = useAuth();
  const { getStableTokenBalance } = useWeb3();
  const { getWithdrawable } = useLending();
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [tokenBalance, withdrawable] = await Promise.all([
        getStableTokenBalance(DEFAULT_CURRENCY),
        getWithdrawable(),
      ]);

      setBalance({
        totalSavings: (Number(tokenBalance) * KES_EXCHANGE_RATE).toFixed(2),
        availableForWithdraw: (
          Number(withdrawable.withdrawable) * KES_EXCHANGE_RATE
        ).toFixed(2),
      });
    } catch (error) {
      console.error("Error fetching account balance:", error);
      toast({
        title: "Error",
        description: "Failed to fetch account balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Savings</CardTitle>
        <CardDescription>
          Track your savings and available loan limit
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Total Savings</div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl font-bold">
                KES {balance?.totalSavings || "0.00"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Available for Withdrawal
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl font-bold">
                KES {balance?.availableForWithdraw || "0.00"}
              </div>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={fetchBalance}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Update Balance
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
