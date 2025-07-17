"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useObjectState } from "../../hooks/use-object-state";
import { cn } from "../../lib/utils";
import { ChevronLeft, Loader } from "lucide-react";
import { toast } from "sonner";
import { safe } from "../../lib/ts-safe";
import { UserZodSchema } from "../../types/user";
// API call for email check
const checkEmailExists = async (email: string) => {
  const response = await fetch('/api/auth/check-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to check email');
  }
  
  const data = await response.json();
  return data.exists;
};
import { customAuthClient } from "../../lib/auth/client-custom";
import { useRouter } from "next/router";
import AuthLayout from "./layout";

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useObjectState({
    email: "",
    name: "",
    password: "",
  });

  const steps = [
    "Enter your email address",
    "Enter your full name",
    "Create a password",
  ];

  const safeProcessWithLoading = function <T>(fn: () => Promise<T>) {
    console.log("safeProcessWithLoading: Starting loading state");
    setIsLoading(true);
    return safe(() => fn()).watch(() => {
      console.log("safeProcessWithLoading: Ending loading state");
      setIsLoading(false);
    });
  };

  const backStep = () => {
    setStep(Math.max(step - 1, 1));
  };

  const successEmailStep = async () => {
    const { success } = UserZodSchema.shape.email.safeParse(formData.email);
    if (!success) {
      toast.error("Please enter a valid email address");
      return;
    }
    const exists = await safeProcessWithLoading(() =>
      checkEmailExists(formData.email),
    ).orElse(false);
    if (exists) {
      toast.error("Account with this email already exists");
      return;
    }
    setStep(2);
  };

  const successNameStep = () => {
    const { success } = UserZodSchema.shape.name.safeParse(formData.name);
    if (!success) {
      toast.error("Please enter your full name");
      return;
    }
    setStep(3);
  };

  const successPasswordStep = async () => {
    console.log("successPasswordStep: Starting");
    console.log("successPasswordStep: Form data:", formData);
    
    const { success } = UserZodSchema.shape.password.safeParse(
      formData.password,
    );
    if (!success) {
      console.log("successPasswordStep: Password validation failed");
      toast.error("Please enter a valid password");
      return;
    }
    
    console.log("successPasswordStep: Password validation passed");
    
    try {
      await safeProcessWithLoading(async () => {
        console.log("Attempting signup with:", { email: formData.email, name: formData.name });
        const result = await customAuthClient.signUp({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        console.log("Signup successful:", result);
        toast.success("Account created successfully!");
        console.log("About to redirect to /chat");
        router.push("/chat");
      }).unwrap();
    } catch (error) {
      console.error("successPasswordStep: Error during signup:", error);
      toast.error(error instanceof Error ? error.message : "Signup failed");
    }
  };

  return (
    <AuthLayout>
      <div className="animate-in fade-in duration-1000 w-full h-full flex flex-col p-4 md:p-8 justify-center relative">
        <div className="w-full flex justify-end absolute top-0 right-0">
          <Link href="/auth/sign-in">
            <Button variant="ghost">Sign In</Button>
          </Link>
        </div>
        <Card className="w-full md:max-w-md bg-background border-none mx-auto gap-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl text-center ">
              Create Account
            </CardTitle>
            <CardDescription className="py-12">
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground text-right">
                  Step {step} of {steps.length}
                </p>
                <div className="h-2 w-full relative bg-input">
                  <div
                    style={{
                      width: `${(step / 3) * 100}%`,
                    }}
                    className="h-full bg-primary transition-all duration-300"
                  ></div>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {step === 1 && (
                <div className={cn("flex flex-col gap-2")}>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    disabled={isLoading}
                    autoFocus
                    value={formData.email}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        (e.nativeEvent as any).isComposing === false
                      ) {
                        successEmailStep();
                      }
                    }}
                    onChange={(e) => setFormData({ email: e.target.value })}
                    required
                  />
                </div>
              )}
              {step === 2 && (
                <div className={cn("flex flex-col gap-2")}>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    disabled={isLoading}
                    autoFocus
                    value={formData.name}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        (e.nativeEvent as any).isComposing === false
                      ) {
                        successNameStep();
                      }
                    }}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    required
                  />
                </div>
              )}
              {step === 3 && (
                <div className={cn("flex flex-col gap-2")}>
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    disabled={isLoading}
                    autoFocus
                    value={formData.password}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        (e.nativeEvent as any).isComposing === false
                      ) {
                        successPasswordStep();
                      }
                    }}
                    onChange={(e) => setFormData({ password: e.target.value })}
                    required
                  />
                </div>
              )}
              <p className="text-muted-foreground text-xs mb-6">
                {steps[step - 1]}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={isLoading}
                  className={cn(step === 1 && "opacity-0", "w-1/2")}
                  variant="ghost"
                  onClick={backStep}
                >
                  <ChevronLeft className="size-4" />
                  Back
                </Button>
                <Button
                  disabled={isLoading}
                  className="w-1/2"
                  onClick={() => {
                    if (step === 1) successEmailStep();
                    if (step === 2) successNameStep();
                    if (step === 3) successPasswordStep();
                  }}
                >
                  {step === 3 ? "Create Account" : "Next"}
                  {isLoading && <Loader className="size-4 ml-2" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}