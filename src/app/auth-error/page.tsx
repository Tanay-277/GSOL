'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    'Configuration': 'There is a problem with the server configuration. Please contact support.',
    'AccessDenied': 'You do not have permission to sign in.',
    'Verification': 'The sign-in link is no longer valid. It may have been used already or it may have expired.',
    'OAuthSignin': 'Error in the OAuth sign-in process. Please try again.',
    'OAuthCallback': 'Error while processing the OAuth callback. Please try again.',
    'OAuthCreateAccount': 'Unable to create a user account using OAuth provider.',
    'EmailCreateAccount': 'Unable to create a user account using email provider.',
    'Callback': 'Error processing the sign-in callback. Please try again.',
    'OAuthAccountNotLinked': 'To confirm your identity, sign in with the same account you used originally.',
    'default': 'An unexpected error occurred. Please try again.',
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.default : errorMessages.default;

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem signing you in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300">{errorMessage}</p>
          {error && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Error code: {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/signin">Try Again</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
