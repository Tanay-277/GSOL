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
      if (event.message.includes("NetworkError") && event.message.includes("/api/auth/session")) {
        console.error("NextAuth session fetch error:", event);
        setErrorCount((prev) => prev + 1);
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  // Only render the real provider after mounting to avoid hydration issues
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SessionProvider session={session} refetchInterval={errorCount > 0 ? 0 : 5 * 60}>
      {children}
    </SessionProvider>
  );
}
