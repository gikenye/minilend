"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface LiquidityContextType {
  poolTotal: number;
  userContribution: number;
  lenderEarnings: number;
  walletBalance: number;
  setPoolTotal: (value: number) => void;
  setUserContribution: (value: number) => void;
  setLenderEarnings: (value: number) => void;
  setWalletBalance: (value: number) => void;
}

const LiquidityContext = createContext<LiquidityContextType | null>(null);

export function LiquidityProvider({ children }: { children: ReactNode }) {
  const [poolTotal, setPoolTotal] = useState(0);
  const [userContribution, setUserContribution] = useState(0);
  const [lenderEarnings, setLenderEarnings] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  return (
    <LiquidityContext.Provider
      value={{
        poolTotal,
        userContribution,
        lenderEarnings,
        walletBalance,
        setPoolTotal,
        setUserContribution,
        setLenderEarnings,
        setWalletBalance,
      }}
    >
      {children}
    </LiquidityContext.Provider>
  );
}

export function useLiquidity() {
  const ctx = useContext(LiquidityContext);
  if (!ctx)
    throw new Error("useLiquidity must be used within LiquidityProvider");
  return ctx;
}
