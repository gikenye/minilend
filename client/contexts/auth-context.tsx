"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
  loginInProgress: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const initialCheckComplete = useRef(false);

  // Utility function to convert string to hex
  const stringToHex = (str: string): string => {
    return `0x${Buffer.from(str, "utf8").toString("hex")}`;
  };

  // Utility function to encode a message in the format MiniPay expects
  const prepareMessageForSigning = (msg: string): string => {
    // Check if the message already starts with "0x"
    if (msg.startsWith("0x")) {
      return msg;
    }

    // First try standard stringToHex
    try {
      return stringToHex(msg);
    } catch (error) {
      console.error("Error converting to hex:", error);
    }

    // Fallback encoding method if standard doesn't work
    try {
      // Use a more direct method encoding the UTF-8 message
      return "0x" + Array.from(new TextEncoder().encode(msg))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error("Error with fallback encoding:", error);
      // Last resort, return original string
      return msg;
    }
  };

  // Check for MiniPay wallet on mount
  useEffect(() => {
    const checkMiniPayWallet = async () => {
      // If we've already completed the initial check, don't run again
      if (initialCheckComplete.current) {
        return;
      }
      
      try {
        if (typeof window === "undefined") {
          setIsMiniPay(false);
          return;
        }

        const isMiniPayEnv = !!window?.ethereum?.isMiniPay;
        setIsMiniPay(isMiniPayEnv);

        // First check for existing token
        const existingToken = localStorage.getItem("auth_token");
        if (existingToken) {
          try {
            await initializeWithToken(existingToken);
            initialCheckComplete.current = true;
            return; // If we successfully initialized with token, don't proceed with login
          } catch (err) {
            console.error("Failed to initialize with stored token:", err);
            localStorage.removeItem("auth_token");
          }
        }

        // Only proceed with MiniPay auto-login if we don't have a valid token
        if (isMiniPayEnv) {
          if (!window.ethereum?.request) {
            throw new Error("MiniPay wallet is not properly initialized");
          }

          try {
            // Skip auto-login if a login is already in progress
            if (!loginInProgress) {
              await login("minipay");
            }
          } catch (loginError: any) {
            console.error("MiniPay login error:", loginError);
            setError(loginError.message || "Failed to login with MiniPay");
          }
        }
      } catch (err: any) {
        console.error("Wallet initialization error:", err);
        setError(err.message || "Failed to initialize wallet");
      } finally {
        setLoading(false);
        initialCheckComplete.current = true;
      }
    };

    checkMiniPayWallet();
  }, [loginInProgress]);

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
    // If already logged in or login is in progress, don't start a new login
    if (user || loginInProgress) {
      return;
    }

    try {
      setLoginInProgress(true);
      setLoading(true);
      setError(null);

      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        window.navigator.userAgent
      );

      if (!window.ethereum) {
        if (isMobile) {
          throw new Error(
            accountType === "minipay"
              ? "Please open this app in MiniPay wallet"
              : "Please open this app in MetaMask or another wallet app"
          );
        } else {
          throw new Error(
            accountType === "minipay"
              ? "Please install MiniPay wallet to continue"
              : "Please install MetaMask to continue"
          );
        }
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

      console.log("Message from server:", message);

      // MiniPay requires a UTF-8 encoded message, not a hex string
      let signature;
      let signSuccess = false;

      // First try with the raw message
      try {
        console.log("Attempting to sign with raw message");
        signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, address],
        });
        signSuccess = true;
        console.log("Raw message signing successful");
      } catch (error: any) {
        console.error("Raw message signing failed:", error?.message || error);
      }

      // If first attempt failed, try with hex-encoded message
      if (!signSuccess) {
        try {
          console.log("Attempting to sign with hex-encoded message");
          const messageAsHex = prepareMessageForSigning(message);
          console.log("Message as hex:", messageAsHex);
          signature = await window.ethereum.request({
            method: "personal_sign",
            params: [messageAsHex, address],
          });
          signSuccess = true;
          console.log("Hex message signing successful");
        } catch (error: any) {
          console.error("Hex message signing failed:", error?.message || error);
          throw new Error("Failed to sign message with wallet: " + (error?.message || "Unknown error"));
        }
      }

      // Verify signature and get token
      const { token } = await apiClient.verifyAuth({
        miniPayAddress: address,
        signature,
        message: message, // Send the original message for server verification
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
      setLoginInProgress(false);
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
        loginInProgress,
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
