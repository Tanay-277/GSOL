"use client";

import { useState, useEffect, ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/dashboard/app-sidebar";
import BreadcrumbInfo from "@/features/dashboard/breadcrumb-info";
import { QueryProvider } from "@/providers/query-provider";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, ShieldAlert, RefreshCcw } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// Crisis resources component for the mental health app
const CrisisResources = () => {
  const [showResources, setShowResources] = useState(false);

  return (
    <div className="w-full border-t border-zinc-200 bg-background px-4 py-2 dark:border-zinc-800">
      <div className="mx-auto max-w-screen-xl">
        <button
          onClick={() => setShowResources(!showResources)}
          className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>
            {showResources
              ? "Hide crisis resources"
              : "Need immediate support?"}
          </span>
        </button>

        {showResources && (
          <div className="mt-2 rounded-md bg-red-50 p-3 text-sm dark:bg-red-900/20">
            <p className="mb-1 font-medium text-red-800 dark:text-red-300">
              If you are experiencing a mental health crisis:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                National Suicide Prevention Lifeline: 988 or 1-800-273-8255
              </li>
              <li>Crisis Text Line: Text HOME to 741741</li>
              <li>Or call emergency services (911 in the US)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom error fallback component for mental health app
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  useEffect(() => {
    // Log errors to monitoring system in production
    console.error("Layout error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-md">
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-bold">Something went wrong</h2>
          <p className="mb-6 text-muted-foreground">
            We are sorry, but we encountered an issue. This will not affect your
            data or previous assessments.
          </p>
          <Button
            onClick={resetErrorBoundary}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Handle hydration issues by waiting for client-side mount
  useEffect(() => {
    setIsMounted(true);

    // Check if this is the user's first visit
    const hasVisitedBefore = localStorage.getItem("hasVisitedBefore");
    if (!hasVisitedBefore) {
      setShowWelcomeMessage(true);
      localStorage.setItem("hasVisitedBefore", "true");

      // Auto-hide welcome message after 7 seconds
      const timer = setTimeout(() => {
        setShowWelcomeMessage(false);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Wait for client-side mount to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col rounded-lg overflow-hidden">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 bg-background pr-4 shadow-sm">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="md:mr-2 md:h-4" />
                <BreadcrumbInfo />
              </div>

              <div className="flex items-center gap-2">
                {/* Could add user-specific components here like notifications or account menu */}
              </div>
            </header>

            {showWelcomeMessage && (
              <Alert className="mx-4 mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Welcome to your mental health companion</AlertTitle>
                <AlertDescription>
                  This is a safe space to assess and track your mental
                  wellbeing. All your information is stored privately on your
                  device.
                </AlertDescription>
              </Alert>
            )}

            <div
              className="flex flex-1 flex-col gap-4 overflow-y-auto border-t border-zinc-200 p-4 dark:border-zinc-800"
              style={{
                scrollBehavior: "smooth",
                scrollbarWidth: "thin",
              }}
            >
              {children}
            </div>

            {/* Add crisis resources footer for mental health support */}
            <CrisisResources />
          </SidebarInset>
        </SidebarProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
