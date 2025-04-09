import { db } from "@/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  // Use PrismaAdapter for better database integration
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/signin",
    error: "/auth-error",
  },
  callbacks: {
    async session({ session, token, user }) {
      if (session?.user) {
        if (token?.sub) {
          session.user.id = token.sub;
        } else if (user?.id) {
          session.user.id = user.id;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async signIn({ user }) {
      // Verify the user exists in the database
      if (user.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
        });

        // If user doesn't exist, create it
        if (!dbUser) {
          try {
            await db.user.create({
              data: {
                email: user.email,
                name: user.name || "User",
                avatar: user.image || null,
              },
            });
          } catch (error) {
            console.error("Error creating user:", error);
            return false;
          }
        }
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  // Make sure we have a secret configured
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};
