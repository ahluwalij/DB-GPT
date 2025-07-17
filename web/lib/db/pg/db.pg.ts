import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.pg";

const connectionString = process.env.DATABASE_URL || "mysql://root:aa123456@localhost:3306/dbgpt";

const client = mysql.createPool(connectionString);

export const pgDb = drizzle(client, { 
  schema, 
  mode: "default" 
});