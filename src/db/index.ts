import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a singleton Prisma Client
export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Ensure only one instance of Prisma Client in development
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
