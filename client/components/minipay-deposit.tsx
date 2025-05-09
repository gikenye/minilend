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
import { Plus, CircleDollarSign, Loader2, AlertCircle, CheckCircle2, Wifi, RefreshCw } from "lucide-react";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "@/types/currencies";
import { useWeb3 } from "@/contexts/useWeb3";
import { createWalletClient, createPublicClient, custom, parseEther, formatEther } from "viem";
import { celoAlfajores } from "viem/chains";
import { stableTokenABI } from "@celo/abis";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLending } from "@/contexts/LendingContext";
import { executeWithRpcFallback, resetRpcConnection } from "@/lib/blockchain-utils";
import { Skeleton } from "@/components/ui/skeleton";

// Token addresses on Alfajores
const TOKEN_ADDRESSES: Record<string, `0x${string}`> = {
  cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
  cREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545",
  USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
};

interface MiniPayDepositProps {
  onDepositComplete?: () => void;
}

interface UserAsset {
  symbol: string;
  name: string;
  balance: string;
  address: `0x${string}`;
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
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  
  const { toast } = useToast();
  const { deposit } = useLending();
  const { getStableTokenBalance, address, getStableTokenAddress, availableCurrencies } = useWeb3();
  
  // Fetch user's available assets
  const fetchUserAssets = async () => {
    setIsLoadingAssets(true);
    setError(null);
    
    try {
      // Reset RPC connection for optimal performance
      resetRpcConnection();
      
      // Only fetch assets for the tokens we support
      const supportedSymbols = Object.keys(TOKEN_ADDRESSES);
      const assets: UserAsset[] = [];
      
      // Use our RPC fallback mechanism for resilience
      await executeWithRpcFallback(async () => {
        // Check balances for each supported token
        for (const symbol of supportedSymbols) {
          try {
            // Skip if token address is undefined
            if (!TOKEN_ADDRESSES[symbol]) continue;
            
            // Get balance for the token
            const balance = await getStableTokenBalance(symbol);
            
            // Only include assets with non-zero balance
            if (Number(balance) > 0) {
              assets.push({
                symbol,
                name: SUPPORTED_CURRENCIES[symbol] || symbol,
                balance,
                address: TOKEN_ADDRESSES[symbol]
              });
            }
          } catch (tokenError) {
            console.error(`Error fetching ${symbol} balance:`, tokenError);
          }
        }
        
        return assets;
      });
      
      // Set user assets and default currency
      setUserAssets(assets);
      
      // If user has assets, set the first one as the default currency
      if (assets.length > 0) {
        setCurrency(assets[0].symbol);
      }
      
    } catch (error) {
      console.error("Error fetching user assets:", error);
      setError("Failed to load your assets. Please check your connection and try again.");
    } finally {
      setIsLoadingAssets(false);
    }
  };
  
  // Check network connection and fetch user assets on component mount
  useEffect(() => {
    const checkNetworkAndAssets = async () => {
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
          // Fetch user assets after confirming network
          fetchUserAssets();
        } else {
          setNetworkStatus('error');
          setError(`Connected to wrong network. Please connect to Celo Alfajores.`);
        }
      } catch (err) {
        console.error("Error checking network:", err);
        setNetworkStatus('error');
      }
    };

    checkNetworkAndAssets();
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
    
    // Check if user has enough balance
    const selectedAsset = userAssets.find(asset => asset.symbol === currency);
    if (selectedAsset && Number(amount) > Number(selectedAsset.balance)) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${selectedAsset.balance} ${currency} available.`,
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

  // Get the selected asset's balance
  const getSelectedAssetBalance = () => {
    const selectedAsset = userAssets.find(asset => asset.symbol === currency);
    return selectedAsset ? selectedAsset.balance : "0";
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
            
            {isLoadingAssets ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : userAssets.length > 0 ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="currency">Your Available Assets</Label>
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={fetchUserAssets}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <Select
                    value={currency}
                    onValueChange={(value) => setCurrency(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {userAssets.map(asset => (
                        <SelectItem key={asset.symbol} value={asset.symbol}>
                          <div className="flex justify-between w-full">
                            <span>{asset.symbol} ({asset.name})</span>
                            <span className="text-muted-foreground">{Number(asset.balance).toFixed(4)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="amount">Amount</Label>
                    <span className="text-xs text-muted-foreground">
                      Available: {Number(getSelectedAssetBalance()).toFixed(4)} {currency}
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
                      onClick={() => setAmount(getSelectedAssetBalance())}
                    >
                      Max
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border p-3 bg-muted/30">
                  <h4 className="text-sm font-medium mb-2">Tips:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Your {currency} tokens will be added to the lending pool</li>
                    <li>• You'll earn interest on your deposit</li>
                    <li>• You can withdraw your funds anytime</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-6 space-y-4">
                <AlertCircle className="h-8 w-8 mx-auto text-amber-500" />
                <h3 className="text-lg font-medium">No Assets Found</h3>
                <p className="text-muted-foreground text-sm">
                  You don't have any supported assets in your MiniPay wallet yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Get started by adding some cUSD, cEUR, or cREAL to your wallet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={fetchUserAssets}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Again
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {!depositSuccess && userAssets.length > 0 && (
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleDepositWithMiniPay}
            disabled={isDepositing || !amount || networkStatus === 'error' || isLoadingAssets}
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