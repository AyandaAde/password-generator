"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Copy, RefreshCw, Shield, Key, Lock } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"

interface PasswordOptions {
  includeNumbers: boolean
  includeSymbols: boolean
  minLength: number
}

export default function PasswordGenerator() {
  const [userInput, setUserInput] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [strengthLabel, setStrengthLabel] = useState("");

  const calculateStrength = useCallback((password: string) => {
    if (!password) return { strength: 0, label: "" }

    let score = 0
    const checks = {
      length: password.length >= 12,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password),
      noRepeats: !/(.)\1{2,}/.test(password),
    }

    score = Object.values(checks).filter(Boolean).length
    const percentage = (score / 6) * 100

    let label = ""
    if (percentage < 40) label = "Weak"
    else if (percentage < 70) label = "Medium"
    else label = "Strong"

    return { strength: percentage, label }
  }, []);

  const generatePassword = useMutation({
    mutationFn: async (options: PasswordOptions) => {
      const { data } = await axios.get("/api/generate-code", {
        params: {
          text: userInput,
          ...options
        }
      });
      return data;
    }
  })

  const handleGenerate = () => {
    const options: PasswordOptions = {
      includeNumbers: true,
      includeSymbols: true,
      minLength: 12,
    }

    generatePassword.mutate(options, {
      onSuccess: (data) => {
        setGeneratedPassword(data.password);
        const { strength, label } = calculateStrength(data.password);
        setPasswordStrength(strength);
        setStrengthLabel(label);
        toast.success("Successfully generated password");
      },
      onError: (error) => {
        console.error("Error generating password", error.message);
        toast.error("Error generating password.", {
          description: "Please try again."
        })
      }
    })
  };

  const copyToClipboard = async () => {
    if (!generatedPassword) return
    try {
      await navigator.clipboard.writeText(generatedPassword)
      toast.success("Password copied!", {
        description: "Your password has been copied to the clipboard.",
      })
    } catch (error: any) {
      console.error("Error copying password", error.message);
      toast.error("Copy failed", {
        description: "Unable to copy password to clipboard."
      })
    }
  }

  // const getStrengthColor = () => {
  //   if (passwordStrength < 40) return "bg-destructive"
  //   if (passwordStrength < 70) return "bg-yellow-500"
  //   return "bg-primary"
  // }

  const getStrengthBadgeVariant = () => {
    if (passwordStrength < 40) return "destructive"
    if (passwordStrength < 70) return "secondary"
    return "default"
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">Password Generator</CardTitle>
          </div>
          <CardDescription>Transform your text into a secure password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="user-input" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Your Text Input
            </Label>
            <Input
              id="user-input"
              type="text"
              placeholder="Enter any text to generate a password..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="bg-input border-border focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!userInput.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generatePassword.isPending && "animate-spin"}`} />
            {
              generatePassword.isPending ? (" Generating Password...") : ("Generate Password")
            }
          </Button>

          {generatedPassword && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Generated Password
                </Label>
                <div className="flex gap-2">
                  <Input type="text" value={generatedPassword} readOnly className="font-mono text-sm bg-card" />
                  <Button onClick={copyToClipboard} size="icon" variant="outline" className="shrink-0 bg-transparent">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Password Strength</Label>
                  <Badge variant={getStrengthBadgeVariant()}>{strengthLabel}</Badge>
                </div>
                <Progress value={passwordStrength} className="h-2" />
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Password length: {generatedPassword.length} characters</p>
                <p>• Contains numbers and symbols for enhanced security</p>
                <p>• Generated from your unique text input</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
