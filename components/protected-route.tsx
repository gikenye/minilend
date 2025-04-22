"use client"

import type React from "react"

// For demo, we'll just render children directly without protection
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
