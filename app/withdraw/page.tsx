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
import { Home, ArrowRight, Wallet } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availableBalance = 1250; // This should come from your context/API

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast({
        title: "Success!",
        description: `KES ${amount} has been sent to your M-PESA`,
      });
      setAmount("");
      setPhone("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not process your withdrawal. Please try again.",
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
        <h1 className="text-2xl font-bold text-foreground">Cash Out</h1>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Withdraw to M-PESA
            </CardTitle>
            <CardDescription>Send money to your mobile money</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">
                  Available Balance
                </div>
                <div className="text-2xl font-bold">USD {availableBalance}</div>
                <div className="text-sm text-muted-foreground">
                  ≈ KES {availableBalance * 140}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="amount">
                  Amount (KES)
                </label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount to withdraw"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min={100}
                  max={availableBalance * 140}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="phone">
                  M-PESA Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 07XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  pattern="^(?:254|\+254|0)?([71](?:(?:0[0-8])|(?:[12][0-9])|(?:9[0-9])|(?:4[0-8])|(?:5[0-9])|(?:6[0-9])|(?:7[0-9])|(?:8[0-9]))[0-9]{6})$"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                type="submit"
                disabled={isSubmitting || !amount || !phone}
              >
                {isSubmitting ? (
                  "Processing..."
                ) : (
                  <>
                    Send to M-PESA
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
