import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function WalletConnect() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isMinipay, setIsMinipay] = useState(false);

  useEffect(() => {
    // Check if we're in MiniPay environment
    setIsMinipay(!!window?.ethereum?.isMiniPay);
  }, []);

  const handleConnect = async () => {
    try {
      await login("external");
    } catch (error: any) {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  // Don't show anything if in MiniPay
  if (isMinipay) {
    return null;
  }

  return (
    <Button
      onClick={handleConnect}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      Connect MetaMask
    </Button>
  );
}
