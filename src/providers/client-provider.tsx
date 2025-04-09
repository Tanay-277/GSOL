"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

export default function ClientProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}): React.ReactNode {
  const [errorCount, setErrorCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Handle session errors gracefully with a retry mechanism
  useEffect(() => {
    setMounted(true);

    // Add a global error handler for fetch errors related to auth
    const handleError = (event: ErrorEvent) => {
      // Look for NextAuth fetch errors
      if (
        (event.message.includes("NetworkError") || event.message.includes("fetch")) && 
        (event.message.includes("/api/auth/session") || event.message.includes("/api/auth/_log"))
      ) {
        console.error("NextAuth session fetch error:", event);
        setErrorCount((prev) => prev + 1);
        
        // Prevent the error from showing in console
        if (event.cancelable) {
          event.preventDefault();
        }
      }
    };

    // Listen for fetch errors
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", (event) => {
      if (event.reason?.message?.includes("/api/auth/") || 
          (typeof event.reason === "string" && event.reason.includes("/api/auth/"))) {
        console.warn("Suppressed NextAuth promise rejection:", event.reason);
        event.preventDefault();
        setErrorCount((prev) => prev + 1);
      }
    });
    
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", () => {});
    };
  }, []);

  // Only render the real provider after mounting to avoid hydration issues
  if (!mounted) {
    return <>{children}</>;
  }

  const refetchInterval = errorCount > 0 ? 0 : 5 * 60; // Disable auto-refetch on errors
  
  return (
    <SessionProvider 
      session={session} 
      refetchInterval={refetchInterval}
      refetchOnWindowFocus={errorCount < 3} // Stop refetching after too many errors
    >
      {children}
    </SessionProvider>
  );
}
