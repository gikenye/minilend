"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { WalletConnect } from "@/components/wallet-connect";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

export default function MiniPayRequired() {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Check if we're in MiniPay environment
    setIsMiniPay(!!window?.ethereum?.isMiniPay);

    // Check if on mobile
    const userAgent = window.navigator.userAgent;
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    );

    // If user is already authenticated, redirect to home
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const openMetaMaskAppLink = () => {
    window.open(
      'https://metamask.app.link/dapp/' + 
      window.location.href.replace(/^https?:\/\//, ''), 
      '_blank'
    );
  };

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md p-6 text-center space-y-6">
        {isMiniPay ? (
          <>
            <h1 className="text-2xl font-bold">Connecting to MiniPay</h1>
            <p>
              Please wait while we connect to your MiniPay wallet...
            </p>
            <div className="flex justify-center pt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Welcome to MiniLend</h1>
            <p className="mb-4">
              This application works best with MiniPay, but you can also use it with
              your regular wallet.
            </p>
            
            {isMobile && (
              <div className="bg-muted p-4 rounded-md mb-4 text-sm">
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
            
            <div className="flex justify-center pt-4">
              <WalletConnect variant="large" />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
