"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCcw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
          <p className="mb-6 text-muted-foreground">
            We apologize for the inconvenience. This error has been logged and our team has been
            notified.
          </p>

          <div className="flex w-full flex-wrap justify-center gap-3">
            <Button onClick={() => reset()} variant="default" className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Try again
            </Button>

            <Button asChild variant="outline" className="flex items-center gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Return home
              </Link>
            </Button>
          </div>
        </div>

        <Alert className="mt-6 bg-amber-50 dark:bg-amber-900/20">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Need support?</AlertTitle>
          <AlertDescription className="text-sm">
            <p className="mb-2">
              If you&apos;re experiencing a mental health crisis, please reach out for help:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>National Suicide Prevention Lifeline: 988 or 1-800-273-8255</li>
              <li>Crisis Text Line: Text HOME to 741741</li>
              <li>Or call emergency services (911 in the US)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="pt-4 text-center text-xs text-muted-foreground">
          <p>Error reference: {error.digest || "unknown"}</p>
        </div>
      </div>
    </div>
  );
}
