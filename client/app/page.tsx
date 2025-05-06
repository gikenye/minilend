"use client";

import { MiniPayHeader } from "@/components/mini-pay-header";
import { Dashboard } from "@/components/dashboard";
import ProtectedRoute from "@/components/protected-route";
import { WalletConnect } from "@/components/wallet-connect";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
          <MiniPayHeader />
          <Dashboard />
          <WalletConnect />
        </div>
      </main>
    </ProtectedRoute>
  );
}
