import { TooltipProvider } from "@/components/ui/tooltip";
import { geistSans } from "@/features/font";
import { cn } from "@/lib/utils";
import ClientProvider from "@/providers/client-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { getServerSession } from "next-auth";
import { Toaster } from "sonner";
import { authOptions } from "./api/auth/[...nextauth]/auth";
import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen w-full scroll-smooth bg-background text-primary antialiased",
          geistSans.variable,
          geistSans.className,
        )}
        suppressHydrationWarning
      >
        <ClientProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
            storageKey="theme-preference"
          >
            <TooltipProvider>
              <Toaster />
              {children}
            </TooltipProvider>
          </ThemeProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
