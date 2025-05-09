"use client";

import { MiniLendHeader } from "@/components/mini-lend-header";
import { Dashboard } from "@/components/dashboard";
import ProtectedRoute from "@/components/protected-route";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col bg-background">
        <MiniLendHeader />
        <div className="container mx-auto px-4 py-6">
          <Dashboard />
        </div>
      </main>
    </ProtectedRoute>
  );
}
