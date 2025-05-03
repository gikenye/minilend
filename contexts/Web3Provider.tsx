"use client";

import { type ReactNode } from "react";
import { Web3Context, useWeb3Provider, type Web3ContextType } from "./useWeb3";

export function Web3Provider({ children }: { children: ReactNode }) {
  const web3Context = useWeb3Provider();
  return (
    <Web3Context.Provider value={web3Context}>{children}</Web3Context.Provider>
  );
}
