import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WalletConnectProps {
  variant?: "default" | "large";
}

export function WalletConnect({ variant = "default" }: WalletConnectProps) {
  const { user, login, isMiniPay } = useAuth();
  const { toast } = useToast();
  const [hideConnectBtn, setHideConnectBtn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're in MiniPay environment
    if (window?.ethereum?.isMiniPay) {
      setHideConnectBtn(true);
      // Auto connect for MiniPay users
      login("minipay").catch((error) => {
        toast({
          title: "MiniPay Connection Error",
          description: error.message || "Failed to connect MiniPay wallet",
          variant: "destructive",
        });
      });
    }

    // Check if on mobile
    const userAgent = window.navigator.userAgent;
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    );
  }, []);

  const handleConnect = async () => {
    try {
      // If on mobile and MetaMask not detected, provide additional guidance
      if (isMobile && !window.ethereum) {
        window.open('https://metamask.app.link/dapp/' + window.location.href.replace(/^https?:\/\//, ''), '_blank');
        toast({
          title: "Mobile Wallet Required",
          description: "Please install MetaMask or open this page in a wallet browser",
          duration: 5000,
        });
        return;
      }
      
      await login("external");
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  // Don't show button if in MiniPay or user is already connected
  if (hideConnectBtn || isMiniPay || user) {
    return null;
  }

  return (
    <Button
      onClick={handleConnect}
      size={variant === "large" ? "lg" : "sm"}
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "large" && "px-8 py-2 text-lg font-semibold"
      )}
    >
      Connect Wallet
    </Button>
  );
}
