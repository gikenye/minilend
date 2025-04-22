"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface VerificationCodeInputProps {
  length?: number
  onComplete: (code: string) => void
}

export function VerificationCodeInput({ length = 6, onComplete }: VerificationCodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value

    // Only allow digits
    if (!/^\d*$/.test(value)) return

    // Update the code array
    const newCode = [...code]
    newCode[index] = value.slice(-1) // Only take the last character
    setCode(newCode)

    // If a digit was entered and there's a next input, focus it
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if code is complete
    const fullCode = newCode.join("")
    if (fullCode.length === length) {
      onComplete(fullCode)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // If backspace is pressed and current input is empty, focus previous input
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim()

    // Only proceed if pasted data is all digits and not longer than our inputs
    if (!/^\d+$/.test(pastedData) || pastedData.length > length) return

    // Fill the code array with pasted digits
    const newCode = [...code]
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }
    setCode(newCode)

    // Focus the next empty input or the last input
    const nextEmptyIndex = newCode.findIndex((digit) => !digit)
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()

    // Check if code is complete
    const fullCode = newCode.join("")
    if (fullCode.length === length) {
      onComplete(fullCode)
    }
  }

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={code[index]}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-lg"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}
