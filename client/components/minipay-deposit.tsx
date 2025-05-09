"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, CircleDollarSign, Loader2, AlertCircle, CheckCircle2, Wifi } from "lucide-react";
import { DEFAULT_CURRENCY } from "@/types/currencies";
import { useWeb3 } from "@/contexts/useWeb3";
import { createWalletClient, createPublicClient, custom, parseEther } from "viem";
import { celoAlfajores } from "viem/chains";
import { stableTokenABI } from "@celo/abis";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLending } from "@/contexts/LendingContext";

// Token addresses on Alfajores
const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
  cREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545",
};

interface MiniPayDepositProps {
  onDepositComplete?: () => void;
}

export function MiniPayDeposit({ onDepositComplete }: MiniPayDepositProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("cUSD");
  const [isDepositing, setIsDepositing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [lastDepositAmount, setLastDepositAmount] = useState("");
  const [lastDepositCurrency, setLastDepositCurrency] = useState("");
  const { toast } = useToast();
  const { deposit } = useLending();
  
  // Check network connection on component mount
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        if (!window.ethereum) {
          setNetworkStatus('error');
          return;
        }

        // Get MiniPay network status
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId'
        });

        // Alfajores testnet chain ID is 0xaef3 (44787)
        if (chainId === '0xaef3') {
          setNetworkStatus('connected');
        } else {
          setNetworkStatus('error');
          setError(`Connected to wrong network. Please connect to Celo Alfajores.`);
        }
      } catch (err) {
        console.error("Error checking network:", err);
        setNetworkStatus('error');
      }
    };

    checkNetwork();
  }, []);

  const handleDepositWithMiniPay = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit.",
        variant: "destructive",
      });
      return;
    }

    setIsDepositing(true);
    setError(null);

    try {
      // Check if MiniPay is available
      if (!window.ethereum || !window.ethereum.isMiniPay) {
        throw new Error("MiniPay is not available. Please open this page in MiniPay browser.");
      }

      toast({
        title: "Starting Deposit Process",
        description: "You'll need to approve the transaction and then confirm the deposit.",
      });

      // The deposit function from LendingContext already handles the approval and deposit
      const hash = await deposit(currency, amount);

      if (!hash) {
        throw new Error("Failed to get transaction hash");
      }

      toast({
        title: "Deposit Initiated",
        description: `Your deposit of ${amount} ${currency} has been sent to the blockchain.`,
      });

      // Wait for transaction confirmation
      try {
        // Create a publicClient to wait for transaction confirmation
        const publicClient = createPublicClient({
          chain: celoAlfajores,
          transport: custom(window.ethereum as any),
        });
        
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === "success") {
          toast({
            title: "Deposit Complete",
            description: `Your deposit of ${amount} ${currency} was successful!`,
          });
          
          // Store the successful deposit details
          setLastDepositAmount(amount);
          setLastDepositCurrency(currency);
          setDepositSuccess(true);
          
          // Clear input field
          setAmount("");
          
          // Notify parent component
          if (onDepositComplete) {
            onDepositComplete();
          }
        } else {
          throw new Error("Transaction failed");
        }
      } catch (waitError) {
        console.error("Error waiting for transaction:", waitError);
        // Even if waiting fails, we still had a successful submission
        toast({
          title: "Deposit Submitted",
          description: "Your transaction was submitted but we couldn't confirm its completion. Please check your balance later.",
        });
        
        // Still clear input and call completion handler since the tx was submitted
        setAmount("");
        if (onDepositComplete) {
          onDepositComplete();
        }
      }
      
    } catch (error: any) {
      console.error("Deposit error:", error);
      setError(error.message || "An error occurred while processing your deposit.");
      toast({
        title: "Deposit Failed",
        description: error.message || "An error occurred while processing your deposit.",
        variant: "destructive",
      });
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Money with MiniPay
          </CardTitle>
          <div className="flex items-center gap-2">
            {networkStatus === 'checking' && (
              <div className="flex items-center">
                <Wifi className="h-4 w-4 text-amber-500 animate-pulse mr-1" />
                <span className="text-xs text-muted-foreground">Checking...</span>
              </div>
            )}
            {networkStatus === 'connected' && (
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-muted-foreground">Connected to Celo</span>
              </div>
            )}
            {networkStatus === 'error' && (
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-destructive mr-1" />
                <span className="text-xs text-muted-foreground">Network Error</span>
              </div>
            )}
          </div>
        </div>
        <CardDescription>
          Deposit funds directly from your MiniPay wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {depositSuccess ? (
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-center">Deposit Successful!</h3>
            <p className="text-center text-muted-foreground">
              Your deposit of {lastDepositAmount} {lastDepositCurrency} has been completed.
            </p>
            <Button 
              variant="outline"
              className="mt-2"
              onClick={() => setDepositSuccess(false)}
            >
              Make another deposit
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                defaultValue="cUSD"
                onValueChange={(value) => setCurrency(value)}
                value={currency}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cUSD">cUSD (Celo Dollar)</SelectItem>
                  <SelectItem value="cEUR">cEUR (Celo Euro)</SelectItem>
                  <SelectItem value="cREAL">cREAL (Celo Real)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex items-center">
                <CircleDollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>

            <div className="mt-4 rounded-lg border p-3 bg-muted/30">
              <h4 className="text-sm font-medium mb-2">Tips:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Make sure you have enough {currency} in your MiniPay wallet</li>
                <li>• Transactions may take a few seconds to complete</li>
                <li>• All transactions will be visible in your MiniPay history</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      {!depositSuccess && (
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleDepositWithMiniPay}
            disabled={isDepositing || !amount || networkStatus === 'error'}
          >
            {isDepositing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Deposit {currency}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 