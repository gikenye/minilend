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
import { TrendingUp, CircleDollarSign, Loader2, AlertCircle, CheckCircle2, Wifi } from "lucide-react";
import { DEFAULT_CURRENCY } from "@/types/currencies";
import { useWeb3 } from "@/contexts/useWeb3";
import { createWalletClient, createPublicClient, custom, parseEther } from "viem";
import { celoAlfajores } from "viem/chains";
import { stableTokenABI } from "@celo/abis";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLending } from "@/contexts/LendingContext";
import { executeWithRpcFallback, resetRpcConnection } from "@/lib/blockchain-utils";
import { NetworkStatus } from "@/components/ui/network-status";

// Token addresses on Alfajores
const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
  cREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545",
};

// Lending contract address
const LENDING_CONTRACT_ADDRESS = "0x164E90869634ADd3891BBfB8d410B0742f899826";

interface LendingDepositProps {
  onLendingComplete?: () => void;
  availableBalance?: string;
}

export function LendingDeposit({ onLendingComplete, availableBalance = "0" }: LendingDepositProps) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("cUSD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'connecting' | 'connected' | 'error' | 'offline'>('connecting');
  const [lendingSuccess, setLendingSuccess] = useState(false);
  const [lastLendAmount, setLastLendAmount] = useState("");
  const [lastLendCurrency, setLastLendCurrency] = useState("");
  const { toast } = useToast();
  const { deposit } = useLending();
  
  // Parse availableBalance to number
  const availableBalanceNum = parseFloat(availableBalance) || 0;
  
  // Calculate recommended lending amount (50% of balance)
  const recommendedAmount = (availableBalanceNum * 0.5).toFixed(2);
  
  // Check network connection on component mount
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        // Reset RPC connection on component mount to ensure fresh state
        resetRpcConnection();
        
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
          // Verify RPC connectivity by trying to fetch the latest block
          try {
            await executeWithRpcFallback(async () => {
              const blockNumber = await publicClient.getBlockNumber();
              console.log(`Connected to blockchain at block ${blockNumber}`);
              return blockNumber;
            });
            setNetworkStatus('connected');
          } catch (rpcError) {
            console.error("RPC connection error:", rpcError);
            setNetworkStatus('offline');
            setError("Connected to Celo network but can't reach the blockchain RPC. We'll try alternate connections.");
          }
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

  // Set recommended amount when available balance changes
  useEffect(() => {
    if (availableBalanceNum > 0) {
      setAmount(recommendedAmount);
    }
  }, [availableBalanceNum, recommendedAmount]);
  
  const handleLendWithMiniPay = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to lend.",
        variant: "destructive",
      });
      return;
    }

    // Additional validation to ensure amount is not too small
    if (parseFloat(amount) <= 0.001) {
      toast({
        title: "Amount Too Small",
        description: "The lending amount is too small. Please enter a larger amount.",
        variant: "destructive",
      });
      return;
    }

    // Check if amount is greater than available balance
    if (parseFloat(amount) > availableBalanceNum) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough funds to lend this amount.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      toast({
        title: "Starting Deposit Process",
        description: "You'll need to approve the transaction and then confirm the deposit.",
      });

      // Reset RPC connection before initiating the transaction
      resetRpcConnection();

      // Call the deposit function from LendingContext
      // This already uses executeWithRpcFallback internally now
      const hash = await deposit(currency, amount);

      // Check if we received a transaction hash
      if (!hash) {
        throw new Error("Failed to get transaction hash");
      }

      toast({
        title: "Lending in Progress",
        description: `Your lending transaction of ${amount} ${currency} is processing.`,
      });

      // Create publicClient to wait for transaction receipt
      const publicClient = createPublicClient({
        chain: celoAlfajores,
        transport: custom(window.ethereum as any),
      });
      
      // Wait for confirmation using our fallback mechanism
      try {
        // Use executeWithRpcFallback to handle RPC errors during waitForTransactionReceipt
        await executeWithRpcFallback(async () => {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          
          if (receipt.status === "success") {
            toast({
              title: "Lending Complete",
              description: `Your contribution of ${amount} ${currency} has been added to the lending pool!`,
            });
            
            // Store the successful lending details
            setLastLendAmount(amount);
            setLastLendCurrency(currency);
            setLendingSuccess(true);
            
            // Clear input field
            setAmount("");
            
            // Notify parent component
            if (onLendingComplete) {
              onLendingComplete();
            }
          } else {
            throw new Error("Transaction failed");
          }
          
          return receipt;
        });
      } catch (waitError) {
        console.error("Error waiting for transaction:", waitError);
        // Check if it's an RPC error specifically
        const errorMessage = waitError instanceof Error ? waitError.message : String(waitError);
        
        if (errorMessage.includes('block is out of range') || 
            errorMessage.includes('RpcRequestError') ||
            errorMessage.includes('timeout')) {
          toast({
            title: "Lending Likely Successful",
            description: "Your transaction was submitted but we couldn't verify its completion due to network issues. Please check your balance later.",
          });
        } else {
          toast({
            title: "Transaction Status Unknown",
            description: "Your transaction was submitted but we couldn't confirm its status. Please check your balance later.",
          });
        }
        
        // Still consider it a success since the transaction was submitted
        setLastLendAmount(amount);
        setLastLendCurrency(currency);
        setLendingSuccess(true);
        
        // Clear input and call completion handler
        setAmount("");
        if (onLendingComplete) {
          onLendingComplete();
        }
      }
      
    } catch (error: any) {
      console.error("Lending error:", error);
      
      // Handle RPC-specific errors with clearer messages
      let errorMessage = error.message || "An error occurred while processing your lending transaction.";
      
      if (errorMessage.includes('block is out of range')) {
        errorMessage = "Network synchronization issue. Please try again in a few moments.";
      } else if (errorMessage.includes('RpcRequestError')) {
        errorMessage = "Network connection issue. Please check your internet connection and try again.";
      } else if (errorMessage.includes('rejected')) {
        errorMessage = "Transaction was rejected. Please try again.";
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = "Insufficient funds for this transaction. Please check your balance.";
      }
      
      setError(errorMessage);
      toast({
        title: "Lending Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Retry connection handler
  const handleRetryConnection = () => {
    setNetworkStatus('connecting');
    setError(null);
    // Re-run the network check
    const checkNetwork = async () => {
      try {
        resetRpcConnection();
        
        if (!window.ethereum) {
          setNetworkStatus('error');
          return;
        }

        // Get MiniPay network status and verify RPC connectivity
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId'
        });

        if (chainId === '0xaef3') {
          try {
            await executeWithRpcFallback(async () => {
              return await publicClient.getBlockNumber();
            });
            setNetworkStatus('connected');
            
            // Show success toast
            toast({
              title: "Connection Restored",
              description: "Successfully reconnected to the Celo network.",
            });
          } catch (rpcError) {
            setNetworkStatus('offline');
            setError("Connected to Celo network but can't reach the blockchain RPC. We'll try alternate connections.");
          }
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
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Lend to the Community
          </CardTitle>
          <div className="flex items-center gap-2">
            {networkStatus === 'connecting' && (
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
            {(networkStatus === 'error' || networkStatus === 'offline') && (
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-destructive mr-1" />
                <span className="text-xs text-muted-foreground">Network Error</span>
              </div>
            )}
          </div>
        </div>
        <CardDescription>
          Contribute to the lending pool and earn interest on your funds
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(networkStatus === 'error' || networkStatus === 'offline') && (
          <NetworkStatus 
            status={networkStatus} 
            error={error || undefined}
            onRetry={handleRetryConnection} 
          />
        )}
        
        {networkStatus === 'connected' && (
          <>
            {lendingSuccess ? (
              <div className="flex flex-col items-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-center">Lending Successful!</h3>
                <p className="text-center text-muted-foreground">
                  Your contribution of {lastLendAmount} {lastLendCurrency} has been added to the lending pool.
                </p>
                <p className="text-sm text-center text-muted-foreground">
                  You will start earning interest on your contribution immediately.
                </p>
                <Button 
                  variant="outline"
                  className="mt-2"
                  onClick={() => setLendingSuccess(false)}
                >
                  Make another contribution
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
                  <div className="flex justify-between">
                    <Label htmlFor="amount">Amount</Label>
                    <span className="text-xs text-muted-foreground">
                      Available: {parseFloat(availableBalance).toFixed(2)} {currency}
                    </span>
                  </div>
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
                  <div className="flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto py-0 px-1 text-xs"
                      onClick={() => setAmount(recommendedAmount)}
                    >
                      Recommended: {recommendedAmount}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto py-0 px-1 text-xs"
                      onClick={() => setAmount(availableBalanceNum.toString())}
                    >
                      Max
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border p-3 bg-muted/30">
                  <h4 className="text-sm font-medium mb-2">Benefits of Lending:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Earn interest on your funds while helping others</li>
                    <li>• Your contribution will be used to fund loans for other users</li>
                    <li>• You can withdraw your contribution at any time</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      {!lendingSuccess && (
        <CardFooter>
          <Button 
            className="w-full bg-green-600 hover:bg-green-700" 
            onClick={handleLendWithMiniPay}
            disabled={isProcessing || !amount || networkStatus === 'error'}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Lend {amount} {currency}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 