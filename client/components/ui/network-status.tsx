import React from 'react';
import { Wifi, WifiOff, RefreshCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { resetRpcConnection } from '@/lib/blockchain-utils';

interface NetworkStatusProps {
  status: 'connected' | 'connecting' | 'error' | 'offline';
  error?: string;
  onRetry?: () => void;
}

export function NetworkStatus({ status, error, onRetry }: NetworkStatusProps) {
  const handleRetry = () => {
    // Reset RPC connection first
    resetRpcConnection();
    // Then call the provided retry handler if any
    if (onRetry) onRetry();
  };

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-500">
        <CheckCircle2 className="h-4 w-4" />
        <span>Connected to Celo Alfajores</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-500">
        <Wifi className="h-4 w-4 animate-pulse" />
        <span>Connecting to network...</span>
      </div>
    );
  }

  return (
    <Card className="w-full mb-4 border-destructive/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <WifiOff className="h-5 w-5 text-destructive" />
          <CardTitle className="text-base text-destructive">Network Connection Issue</CardTitle>
        </div>
        <CardDescription>
          There was a problem connecting to the Celo Alfajores network.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        <p className="text-sm mt-2">
          The app will automatically try connecting to backup networks. You can manually retry 
          the connection or check your internet connection.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={handleRetry}
        >
          <RefreshCcw className="h-4 w-4" />
          Retry Connection
        </Button>
      </CardFooter>
    </Card>
  );
} 