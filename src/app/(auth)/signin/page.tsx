"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ContinueWithGoogle from "@/features/auth/continue-with-google";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "100vw",
        background: "linear-gradient(to bottom, #faf5ff, #ecd4fc, transparent)",
      }}
    >
      <Card className="mx-4 mb-10 w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="mt-5 text-2xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ContinueWithGoogle />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                OR
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="tom@ui8.net" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
            <Button
              className="w-full bg-[#000000] hover:bg-[#000000]/20"
              type="submit"
            >
              Login
            </Button>
          </div>
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Sign up for Free
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
