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

interface CreditRadarProps {
  creditScore: any | null;
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
            name: "Account Activity",
            value: creditScore.breakdown.transactionFrequency,
            color: "hsl(var(--primary) / 0.8)",
          },
          {
            name: "Savings Level",
            value: creditScore.breakdown.savingsPattern,
            color: "hsl(var(--primary) / 0.6)",
          },
          {
            name: "Trust Score",
            value: creditScore.breakdown.socialConnections,
            color: "hsl(var(--primary) / 0.9)",
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
    ctx.fillStyle = "hsl(var(--muted) / 0.3)";
    ctx.fill();

    // Draw radar lines
    const numFactors = factors.length;
    ctx.strokeStyle = "hsl(var(--muted))";
    ctx.lineWidth = 1;

    for (let i = 0; i < numFactors; i++) {
      const angle = (i / numFactors) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + radius * Math.cos(angle),
        centerY + radius * Math.sin(angle)
      );
      ctx.stroke();
    }

    // Draw data area
    ctx.beginPath();
    for (let i = 0; i < numFactors; i++) {
      const angle = (i / numFactors) * Math.PI * 2;
      const value = factors[i].value;
      const pointX = centerX + radius * value * Math.cos(angle);
      const pointY = centerY + radius * value * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    }
    ctx.closePath();
    ctx.fillStyle = "hsl(var(--primary) / 0.2)";
    ctx.fill();
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    for (let i = 0; i < numFactors; i++) {
      const angle = (i / numFactors) * Math.PI * 2;
      const value = factors[i].value;
      const pointX = centerX + radius * value * Math.cos(angle);
      const pointY = centerY + radius * value * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(pointX, pointY, 4, 0, Math.PI * 2);
      ctx.fillStyle = factors[i].color;
      ctx.fill();
    }
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
                strokeWidth="4"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - score / 850)}
                transform="rotate(-90 48 48)"
              />
            </svg>
          </div>
        </div>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            className="max-w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {factors.map((factor, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: factor.color }}
              />
              <div className="text-xs">
                <div>{factor.name}</div>
                <div className="font-medium">
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
