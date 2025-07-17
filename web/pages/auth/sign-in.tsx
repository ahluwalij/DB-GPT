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
import { Loader } from "lucide-react";
import { safe } from "../../lib/ts-safe";
import { customAuthClient } from "../../lib/auth/client-custom";
import { toast } from "sonner";
import { GithubIcon } from "../../components/ui/github-icon";
import { GoogleIcon } from "../../components/ui/google-icon";
import AuthLayout from "./layout";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useObjectState({
    email: "",
    password: "",
  });

  const emailAndPasswordSignIn = () => {
    setLoading(true);
    safe(async () => {
      const result = await customAuthClient.signIn({
        email: formData.email,
        password: formData.password,
      });
      console.log("Sign-in successful:", result);
      
      // Force a full page reload to ensure auth state is updated
      window.location.href = "/chat";
    })
      .watch(() => setLoading(false))
      .unwrap();
  };

  const googleSignIn = () => {
    toast.warning("Google sign-in is not available in this implementation");
  };

  const githubSignIn = () => {
    toast.warning("GitHub sign-in is not available in this implementation");
  };

  return (
    <AuthLayout>
      <div className="w-full h-full flex flex-col p-4 md:p-8 justify-center">
        <Card className="w-full md:max-w-md bg-background border-none mx-auto shadow-none animate-in fade-in duration-1000">
          <CardHeader className="my-4">
            <CardTitle className="text-2xl text-center my-1">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  autoFocus
                  disabled={loading}
                  value={formData.email}
                  onChange={(e) => setFormData({ email: e.target.value })}
                  type="email"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  disabled={loading}
                  value={formData.password}
                  placeholder="********"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      emailAndPasswordSignIn();
                    }
                  }}
                  onChange={(e) => setFormData({ password: e.target.value })}
                  type="password"
                  required
                />
              </div>
              <Button
                className="w-full"
                onClick={emailAndPasswordSignIn}
                disabled={loading}
              >
                {loading ? (
                  <Loader className="size-4 animate-spin ml-1" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-accent"></div>
              <span className="px-4 text-sm text-muted-foreground">
                or continue with
              </span>
              <div className="flex-1 h-px bg-accent"></div>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={googleSignIn}
                className="flex-1 "
              >
                <GoogleIcon className="size-4 fill-foreground" />
                Google
              </Button>
              <Button variant="outline" onClick={githubSignIn} className="flex-1">
                <GithubIcon className="size-4 fill-foreground" />
                GitHub
              </Button>
            </div>

            <div className="my-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="underline-offset-4 text-primary">
                Sign Up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}