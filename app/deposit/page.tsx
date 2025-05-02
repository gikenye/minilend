"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MiniPayHeader } from "@/components/mini-pay-header";
import { Home, ArrowRight, Plus, CircleDollarSign } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mpesa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentSavings = 1250; // This should come from your context/API

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: "Success!",
        description:
          "You will receive an M-PESA prompt to complete the deposit.",
      });
      setAmount("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not initiate deposit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <MiniPayHeader />
      <div className="container px-4 py-6 mx-auto space-y-6 max-w-md">
        <h1 className="text-2xl font-bold text-foreground">Add Money</h1>

        {/* Current Savings Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              Current Savings
            </CardTitle>
            <CardDescription>
              Your available savings in MiniLend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">USD {currentSavings}</div>
            <div className="text-sm text-muted-foreground">
              ≈ KES {currentSavings * 140}
            </div>
          </CardContent>
        </Card>

        {/* Deposit Form Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Money
            </CardTitle>
            <CardDescription>
              Deposit funds to increase your loan limit
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="amount">
                  Amount (KES)
                </label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount to deposit"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min={100}
                />
                <div className="text-xs text-muted-foreground">
                  Minimum deposit: KES 100
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select defaultValue={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mpesa">M-PESA</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {method === "mpesa" && (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="text-sm mb-1">How it works:</div>
                  <ol className="text-sm text-muted-foreground list-decimal pl-4 space-y-1">
                    <li>Enter the amount you want to deposit</li>
                    <li>Click "Continue" to get an M-PESA prompt</li>
                    <li>Enter your M-PESA PIN to complete the deposit</li>
                  </ol>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                type="submit"
                disabled={isSubmitting || !amount}
              >
                {isSubmitting ? (
                  "Processing..."
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

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
    </main>
  );
}
