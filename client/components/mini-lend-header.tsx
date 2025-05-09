"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { WalletConnect } from "@/components/wallet-connect";

export function MiniLendHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/minilend_logo.svg"
            alt="MiniLend Logo"
            width={28}
            height={28}
            className="rounded-sm"
          />
          <span className="font-semibold">MiniLend by Pesabits</span>
        </div>

        <div className="flex items-center gap-2">
          <WalletConnect />
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => router.push("/loan-history")}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">View History</span>
          </Button>
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
} 