"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "@/components/ui/use-toast";

interface AccountBalance {
  savings: string;
  available: string;
}

export function SavingsAccount() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setBalance({
        savings: "500.00",
        available: "250.00",
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
                ${balance?.savings || "0.00"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Available for Loans
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl font-bold">
                ${balance?.available || "0.00"}
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
