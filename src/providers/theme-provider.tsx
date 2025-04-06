"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import * as React from "react";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch by only mounting theme provider on client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Force theme to be handled entirely client-side to prevent hydration mismatch
  return (
    <NextThemesProvider {...props} enableSystem={mounted ? props.enableSystem : false}>
      {children}
    </NextThemesProvider>
  );
}
