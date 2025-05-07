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
  isMiniPay: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMiniPay, setIsMiniPay] = useState(false);

  // Utility function to convert string to hex
  const stringToHex = (str: string): string => {
    return `0x${Buffer.from(str, "utf8").toString("hex")}`;
  };

  // Check for MiniPay wallet on mount
  useEffect(() => {
    const checkMiniPayWallet = async () => {
      try {
        if (typeof window === "undefined") {
          setIsMiniPay(false);
          return;
        }

        const isMiniPayEnv = !!window?.ethereum?.isMiniPay;
        setIsMiniPay(isMiniPayEnv);

        if (isMiniPayEnv) {
          // Check if ethereum is properly initialized
          if (!window.ethereum?.request) {
            throw new Error("MiniPay wallet is not properly initialized");
          }

          try {
            // Auto-login for MiniPay users
            await login("minipay");
          } catch (loginError: any) {
            console.error("MiniPay login error:", loginError);
            setError(loginError.message || "Failed to login with MiniPay");
          }
        } else {
          // No MiniPay, check for stored session
          const token = localStorage.getItem("auth_token");
          if (token) {
            await initializeWithToken(token);
          }
        }
      } catch (err: any) {
        console.error("MiniPay initialization error:", err);
        setError(err.message || "Failed to initialize MiniPay");
      } finally {
        setLoading(false);
      }
    };
    checkMiniPayWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeWithToken = async (token: string) => {
    try {
      localStorage.setItem("auth_token", token);
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
        throw new Error(
          accountType === "minipay"
            ? "Please install MiniPay wallet to continue"
            : "Please install MetaMask to continue"
        );
      }

      // Check wallet type compatibility
      const isMinipayEnv = !!window.ethereum.isMiniPay;
      if (accountType === "minipay" && !isMinipayEnv) {
        throw new Error("Please use MiniPay wallet to continue");
      }
      if (accountType === "external" && isMinipayEnv) {
        throw new Error("MetaMask connection is not supported in MiniPay");
      }

      // Requesting account addresses
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
        params: [],
      });

      if (!accounts || !accounts[0]) {
        throw new Error("No accounts found. Please unlock your wallet.");
      }
      const address = accounts[0];

      // Get authentication challenge from your backend
      const { message, nonce } = await apiClient.getAuthChallenge(address);
      if (!message || !nonce) {
        throw new Error("Invalid challenge response from server");
      }

      // Convert the message to hex format before signing
      const messageToSign = stringToHex(message);

      // Request signature with the hex-encoded message
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [messageToSign, address],
      });

      // Verify signature and get token using the original message
      const { token } = await apiClient.verifyAuth({
        miniPayAddress: address,
        signature,
        message: message, // Send the original message for server verification
        walletType: accountType,
      });

      if (!token) {
        throw new Error("No token received from server");
      }

      await initializeWithToken(token);
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Failed to login");
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
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
        isMiniPay,
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
