import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/mysql/schema.mysql.ts",
  out: "./lib/db/migrations/mysql",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "mysql://root:aa123456@localhost:3306/dbgpt",
  },
});