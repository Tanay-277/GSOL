import NextAuth from "next-auth";
import { authOptions } from "./auth";

// Use a direct export of the handlers instead of a variable assignment
export const { GET, POST } = NextAuth(authOptions);
