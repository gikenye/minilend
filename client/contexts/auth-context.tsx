"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import type { EthereumProvider } from "../types/minipay";

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface User {
  miniPayAddress?: string;
  accountNumber: string;
  balance: string;
  isConnected: boolean;
  creditScore?: number;
  loanLimit?: number;
  name?: string;
  accountType: "minipay" | "external";
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (accountType?: "minipay" | "external") => Promise<void>;
  logout: () => void;
  updateBalance: (balance: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try to restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      initializeWithToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const initializeWithToken = async (token: string) => {
    try {
      // Set token in API client
      localStorage.setItem("auth_token", token);

      // Fetch user profile
      const profile = await apiClient.getUserProfile();

      setUser({
        accountNumber: profile.address,
        miniPayAddress: profile.address,
        balance: profile.balance || "0",
        isConnected: true,
        creditScore: profile.creditScore,
        loanLimit: profile.loanLimit,
        accountType: "minipay",
        token,
      });
    } catch (err) {
      console.error("Failed to initialize with token:", err);
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (accountType: "minipay" | "external" = "minipay") => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("No wallet provider found");
      }

      // Request wallet connection
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || !accounts[0]) {
        throw new Error("No accounts found");
      }

      const address = accounts[0];

      // Get authentication challenge
      const { challenge } = await apiClient.getAuthChallenge(address);

      // Request signature
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [challenge, address],
      });

      // Verify signature and get token
      const { token } = await apiClient.verifyAuth({
        miniPayAddress: address,
        signature,
        message: challenge,
      });

      // Initialize session with token
      await initializeWithToken(token);
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Failed to login");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    setError(null);
  };

  const updateBalance = async (balance: string) => {
    if (user) {
      setUser({
        ...user,
        balance,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        updateBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
