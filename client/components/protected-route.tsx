"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, error } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      // Check if we're in MiniPay environment
      if (window?.ethereum?.isMiniPay) {
        toast({
          title: "Connecting to MiniPay...",
          description: "Please wait while we connect to your wallet",
        });
      } else {
        toast({
          title: "MiniPay Required",
          description: "Please open this app in MiniPay to continue",
          variant: "destructive",
        });
      }
      router.push("/");
    }
  }, [user, loading, router, toast]);

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

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
