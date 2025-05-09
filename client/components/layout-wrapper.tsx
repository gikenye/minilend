"use client";

import React from "react";
import { BlockchainStatus } from "./blockchain-status";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <BlockchainStatus />
      {children}
    </div>
  );
} 