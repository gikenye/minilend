import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { Web3Provider } from "@/contexts/Web3Provider";
import { LendingProvider } from "@/contexts/LendingContext";
import { LiquidityProvider } from "@/contexts/LiquidityContext";
import { LayoutWrapper } from "@/components/layout-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MiniPay Instant Loans",
  description:
    "Get quick loans in your local currency using your savings as security. No paperwork needed!",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Web3Provider>
              <LendingProvider>
                <LiquidityProvider>
                  <LayoutWrapper>
                    {children}
                  </LayoutWrapper>
                  <Toaster />
                </LiquidityProvider>
              </LendingProvider>
            </Web3Provider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
