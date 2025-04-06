import { db } from "@/db";
import { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
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
  callbacks: {
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: session.user.email },
          include: {
            courses: true,
          },
        });

        if (dbUser && session.user) {
          session.user.id = dbUser.id;
          session.user.email = dbUser.email;
        }
      }

      return session;
    },
    async signIn({ user }) {
      if (!user.email || !user) {
        return false;
      }

      try {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name || "Guest",
              avatar: user.image || "",
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};
