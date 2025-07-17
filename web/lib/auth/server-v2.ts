import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  AccountSchema,
  SessionSchema,
  UserSchema,
  VerificationSchema,
} from "../db/pg/schema.pg";

// Create a fresh database connection
const connectionString = process.env.DATABASE_URL || "mysql://root:aa123456@localhost:3306/dbgpt";
const client = mysql.createPool(connectionString);
const db = drizzle(client, { 
  schema: {
    user: UserSchema,
    session: SessionSchema,
    account: AccountSchema,
    verification: VerificationSchema,
  },
  mode: "default" 
});

export const authV2 = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-here",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user: UserSchema,
      session: SessionSchema,
      account: AccountSchema,
      verification: VerificationSchema,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      generateId: false,
    },
  },
});