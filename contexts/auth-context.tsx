"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Dummy user data for demo
const DUMMY_USER = {
  id: "user_123456",
  phoneNumber: "+254712345678",
  celoWalletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  token: "dummy_token_for_demo",
}

interface User {
  id: string
  phoneNumber: string
  celoWalletAddress: string
  token: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  sendOTP: (phoneNumber: string) => Promise<boolean>
  verifyOTP: (phoneNumber: string, otp: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // For demo, we'll start with the dummy user already authenticated
  const [user, setUser] = useState<User | null>(DUMMY_USER)
  const [isLoading, setIsLoading] = useState(false)

  // Demo OTP functions that always succeed
  const sendOTP = async (phoneNumber: string): Promise<boolean> => {
    setIsLoading(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    return true
  }

  const verifyOTP = async (phoneNumber: string, otp: string): Promise<boolean> => {
    setIsLoading(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setUser(DUMMY_USER)
    setIsLoading(false)
    return true
  }

  const logout = () => {
    // For demo, we'll just log out and immediately log back in
    setUser(null)
    setTimeout(() => setUser(DUMMY_USER), 1000)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: true, // Always authenticated for demo
        sendOTP,
        verifyOTP,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
