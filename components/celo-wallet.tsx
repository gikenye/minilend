"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, ExternalLink, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/components/ui/use-toast"

interface WalletBalance {
  CELO: string
  cUSD: string
}

export function CeloWallet() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchBalance = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setBalance({
        CELO: "0.5",
        cUSD: "25.0",
      })
    } catch (error) {
      console.error("Error fetching wallet balance:", error)
      toast({
        title: "Error",
        description: "Failed to fetch wallet balance",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [user])

  const copyAddress = () => {
    if (!user?.celoWalletAddress) return

    navigator.clipboard.writeText(user.celoWalletAddress)
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    })
  }

  const openExplorer = () => {
    if (!user?.celoWalletAddress) return

    // Open Celo Explorer (Alfajores testnet)
    window.open(`https://alfajores-blockscout.celo-testnet.org/address/${user.celoWalletAddress}`, "_blank")
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Celo Wallet</CardTitle>
        <CardDescription>Your MiniPay-connected Celo wallet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Wallet Address</div>
          {user?.celoWalletAddress ? (
            <div className="flex items-center gap-2">
              <div className="text-sm font-mono bg-muted p-2 rounded-md overflow-hidden text-ellipsis">
                {user.celoWalletAddress}
              </div>
              <Button variant="ghost" size="icon" onClick={copyAddress} title="Copy Address">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={openExplorer} title="View on Explorer">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Skeleton className="h-10 w-full" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">CELO Balance</div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl font-bold">{balance?.CELO || "0"} CELO</div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">cUSD Balance</div>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl font-bold">{balance?.cUSD || "0"} cUSD</div>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={fetchBalance} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Balance
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
