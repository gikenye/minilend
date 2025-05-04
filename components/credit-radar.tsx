"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CreditFactor = {
  name: string;
  value: number;
  color: string;
};

interface CreditScoreBreakdown {
  repaymentHistory: number;
  transactionFrequency: number;
  savingsPattern: number;
  accountAge: number;
}

interface CreditScoreData {
  score: number;
  breakdown: CreditScoreBreakdown;
}

interface CreditRadarProps {
  creditScore: CreditScoreData | null;
}

export function CreditRadar({ creditScore }: CreditRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [factors, setFactors] = useState<CreditFactor[]>([]);

  useEffect(() => {
    if (creditScore) {
      const timer = setTimeout(() => {
        setScore(creditScore.score);

        setFactors([
          {
            name: "Payment History",
            value: creditScore.breakdown.repaymentHistory,
            color: "hsl(var(--primary))",
          },
          {
            name: "Activity Level",
            value: creditScore.breakdown.transactionFrequency,
            color: "hsl(var(--primary) / 0.8)",
          },
          {
            name: "Savings Pattern",
            value: creditScore.breakdown.savingsPattern,
            color: "hsl(var(--primary) / 0.6)",
          },
          {
            name: "Account Age",
            value: creditScore.breakdown.accountAge,
            color: "hsl(var(--primary) / 0.5)",
          },
        ]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [creditScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || factors.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    const size = canvas.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw radar background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.stroke();

    // Draw radar rings
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius * i) / 4, 0, Math.PI * 2);
      ctx.strokeStyle = "hsl(var(--border) / 0.5)";
      ctx.stroke();
    }

    // Draw factor axes
    factors.forEach((factor, i) => {
      const angle = (i / factors.length) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.strokeStyle = "hsl(var(--border))";
      ctx.stroke();
    });

    // Draw factor values
    ctx.beginPath();
    factors.forEach((factor, i) => {
      const angle = (i / factors.length) * Math.PI * 2 - Math.PI / 2;
      const point = {
        x: centerX + Math.cos(angle) * radius * factor.value,
        y: centerY + Math.sin(angle) * radius * factor.value,
      };
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = "hsl(var(--primary) / 0.2)";
    ctx.fill();
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.stroke();

    // Draw factor points
    factors.forEach((factor, i) => {
      const angle = (i / factors.length) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(angle) * radius * factor.value,
        centerY + Math.sin(angle) * radius * factor.value,
        4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = factor.color;
      ctx.fill();
    });
  }, [factors]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Loan Eligibility Score</CardTitle>
        <CardDescription>
          Your personalized loan limit is based on these factors
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-center mb-4">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-muted/30">
            <div className="text-2xl font-bold">{score}</div>
            <svg
              className="absolute inset-0"
              width="96"
              height="96"
              viewBox="0 0 96 96"
            >
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeDasharray={`${(score / 1000) * 276} 276`}
                transform="rotate(-90 48 48)"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>
        </div>

        <div className="relative aspect-square">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="w-full h-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {factors.map((factor) => (
            <div key={factor.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: factor.color }}
              />
              <div className="flex flex-col">
                <div className="text-xs font-medium">{factor.name}</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(factor.value * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
