"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import type React from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If we're not loading and there's no user, we assume we're in a non-MiniPay environment
    if (!loading && !user) {
      console.error("This app requires MiniPay browser environment");
    }
  }, [user, loading]);

  // Always render children since we're in MiniPay browser
  return <>{children}</>;
}
