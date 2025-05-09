"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { WalletConnect } from "@/components/wallet-connect";
import { Button } from "@/components/ui/button";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, error, isMiniPay } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isShowingConnect, setIsShowingConnect] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're in MiniPay environment
    if (!loading && !user) {
      if (window?.ethereum?.isMiniPay) {
        toast({
          title: "Connecting to MiniPay...",
          description: "Please wait while we connect to your wallet",
        });
      } else {
        // For non-MiniPay users, show connect wallet UI instead of redirecting
        setIsShowingConnect(true);
      }
    }

    // Check if on mobile
    const userAgent = window.navigator.userAgent;
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    );
  }, [user, loading, toast]);

  // Open in MetaMask mobile app
  const openMetaMaskAppLink = () => {
    window.open(
      'https://metamask.app.link/dapp/' + 
      window.location.href.replace(/^https?:\/\//, ''), 
      '_blank'
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error state if there is one
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive font-semibold">Authentication Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!user && isShowingConnect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <div className="text-center space-y-4 mb-4">
          <h2 className="text-2xl font-bold">Welcome to MiniLend</h2>
          <p className="text-muted-foreground">
            Connect your wallet to access the application
          </p>
        </div>
        
        {isMobile && (
          <div className="bg-muted p-4 rounded-md mb-4 text-sm w-full max-w-md">
            <p className="font-medium mb-2">Using a mobile device?</p>
            <p className="mb-3">For the best experience, open this page directly in your wallet app's browser.</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={openMetaMaskAppLink}
            >
              Open in MetaMask
            </Button>
          </div>
        )}
        
        <WalletConnect variant="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
