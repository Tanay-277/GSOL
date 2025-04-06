"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorToast } from "../global/toast";

const ContinueWithGoogle = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const result = await signIn("google", {
        redirect: true,
        callbackUrl: `${window.location.origin}/onboarding`,
      });

      if (result?.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Google login error:", error);
      errorToast("Something went wrong. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOpenApp = () => {
    router.push("/course");
  };

  return (
    <>
      {user ? (
        <Button
          variant="default"
          className="flex h-8 w-full gap-2 space-x-2 px-4"
          onClick={handleOpenApp}
        >
          Open App
        </Button>
      ) : (
        <Button
          variant="default"
          className="flex h-8 w-full gap-2 space-x-2 px-4"
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
        >
          Log In
        </Button>
      )}
    </>
  );
};

export default ContinueWithGoogle;
