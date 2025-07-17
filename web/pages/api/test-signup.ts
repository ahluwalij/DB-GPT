import { NextApiRequest, NextApiResponse } from "next";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { UserSchema } from "../../lib/db/pg/schema.pg";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL || "mysql://root:aa123456@localhost:3306/dbgpt";
const client = mysql.createPool(connectionString);
const db = drizzle(client, { mode: "default" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    
    await db.insert(UserSchema).values({
      id: userId,
      name,
      email,
      emailVerified: false,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(200).json({ 
      success: true, 
      message: "User created successfully",
      user: { id: userId, name, email }
    });
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
}