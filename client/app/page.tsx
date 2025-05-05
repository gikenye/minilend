"use client";

import { MiniPayHeader } from "@/components/mini-pay-header";
import { Dashboard } from "@/components/dashboard";
import ProtectedRoute from "@/components/protected-route";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col bg-background">
        <MiniPayHeader />
        <Dashboard />
      </main>
    </ProtectedRoute>
  );
}
