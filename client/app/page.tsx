"use client";

import { MiniPayHeader } from "@/components/mini-pay-header";
import { Dashboard } from "@/components/dashboard";
import ProtectedRoute from "@/components/protected-route";
import { WalletConnect } from "@/components/wallet-connect";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col bg-background">
        <MiniPayHeader />
        <div className="container mx-auto px-4 py-6">
          <Dashboard />
          <WalletConnect />
        </div>
      </main>
    </ProtectedRoute>
  );
}
