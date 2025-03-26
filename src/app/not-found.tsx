"use client";

import { Home, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="rounded-full bg-muted/50 p-8 mx-auto w-fit">
          <Info className="h-16 w-16 text-muted-foreground" />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
        
        <p className="text-muted-foreground text-lg">
          We couldn't find the page you're looking for. 
          Your wellbeing journey is important to us - let's get you back on track.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Button 
            asChild
            variant="default"
            size="lg"
            className="flex items-center gap-2"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Return home
            </Link>
          </Button>
          
          <Button 
            asChild
            variant="outline"
            size="lg" 
            className="flex items-center gap-2"
          >
            <Link href="/onboarding">
              <Search className="h-4 w-4" />
              Try an assessment
            </Link>
          </Button>
        </div>
        
        <div className="mt-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-left">
          <h3 className="font-semibold mb-2">Need assistance?</h3>
          <p className="text-sm text-muted-foreground">
            If you're looking for mental health resources, visit our <Link href="/onboarding" className="text-primary underline">assessment page</Link> or 
            the <Link href="/history" className="text-primary underline">history page</Link> to view your previous assessments.
          </p>
          <p className="text-sm mt-2 text-muted-foreground">
            If you're experiencing a crisis, please call the National Suicide Prevention Lifeline at 988 
            or text HOME to 741741 to reach the Crisis Text Line.
          </p>
        </div>
      </div>
    </div>
  );
}
