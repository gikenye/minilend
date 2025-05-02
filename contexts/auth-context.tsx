"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

declare global {
  interface Window {
    ethereum?: {
      isMiniPay?: boolean;
      request: (args: { method: string }) => Promise<any>;
    };
  }
}

interface User {
  miniPayAccount?: string;
  accountNumber: string;
  balance: string;
  isConnected: boolean;
  creditScore?: number;
  loanLimit?: number;
  name?: string;
  accountType: "minipay" | "external";
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          try {
            const accounts = await window.ethereum.request({
              method: "eth_accounts",
            });

            if (accounts && accounts[0]) {
              setUser({
                accountNumber: accounts[0],
                miniPayAccount: accounts[0],
                balance: "0",
                isConnected: true,
                accountType: "minipay",
              });
            }
          } catch (err) {
            console.error("Silent auth initialization failed:", err);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      if (typeof window !== "undefined" && window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts && accounts[0]) {
          const newUser: User = {
            accountNumber: accounts[0],
            miniPayAccount: accounts[0],
            balance: "0",
            isConnected: true,
            accountType: "minipay",
          };
          setUser(newUser);
          updateBalance("100.00");
        }
      }
    } catch (err) {
      console.error("Silent login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
  };

  const updateBalance = (balance: string) => {
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
