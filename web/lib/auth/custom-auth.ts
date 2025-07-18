import { NextApiRequest, NextApiResponse } from "next";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { UserSchema, SessionSchema } from "../db/mysql/schema.mysql";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL || "mysql://root:aa123456@localhost:3306/dbgpt";
const client = mysql.createPool(connectionString);
const db = drizzle(client, { 
  schema: { user: UserSchema, session: SessionSchema },
  mode: "default" 
});

// Track if tables have been initialized
let tablesInitialized = false;

// Ensure required tables exist
async function ensureTablesExist() {
  if (tablesInitialized) return;
  
  try {
    const connection = await client.getConnection();
    
    // Create user table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`user\` (
        \`id\` varchar(36) NOT NULL PRIMARY KEY,
        \`name\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL UNIQUE,
        \`email_verified\` boolean NOT NULL DEFAULT false,
        \`password\` varchar(255),
        \`image\` varchar(500),
        \`preferences\` json,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create session table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`session\` (
        \`id\` varchar(36) NOT NULL PRIMARY KEY,
        \`expires_at\` timestamp NOT NULL,
        \`token\` varchar(255) NOT NULL UNIQUE,
        \`created_at\` timestamp NOT NULL,
        \`updated_at\` timestamp NOT NULL,
        \`ip_address\` varchar(45),
        \`user_agent\` varchar(500),
        \`user_id\` varchar(36) NOT NULL,
        FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE
      )
    `);

    connection.release();
    tablesInitialized = true;
  } catch (error) {
    console.error("Error ensuring tables exist:", error);
  }
}

export async function signUpUser(email: string, password: string, name: string) {
  try {
    // Ensure tables exist before operation
    await ensureTablesExist();
    
    // Check if user already exists
    const existingUser = await db.select().from(UserSchema).where(eq(UserSchema.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error("User already exists");
    }

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

    // Create session for the new user (auto sign-in after signup)
    const sessionId = uuidv4();
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(SessionSchema).values({
      id: sessionId,
      userId,
      token: sessionToken,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { 
      success: true, 
      user: { id: userId, name, email },
      session: { token: sessionToken, expiresAt }
    };
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
}

export async function signInUser(email: string, password: string) {
  try {
    // Ensure tables exist before operation
    await ensureTablesExist();
    
    // Find user by email
    const users = await db.select().from(UserSchema).where(eq(UserSchema.email, email)).limit(1);
    if (users.length === 0) {
      throw new Error("Invalid credentials");
    }

    const user = users[0];
    
    // Check password
    if (!user.password) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Create session
    const sessionId = uuidv4();
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(SessionSchema).values({
      id: sessionId,
      userId: user.id,
      token: sessionToken,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { 
      success: true, 
      user: { id: user.id, name: user.name, email: user.email },
      session: { token: sessionToken, expiresAt }
    };
  } catch (error) {
    console.error("Signin error:", error);
    throw error;
  }
}

export async function getSession(token: string) {
  try {
    // Ensure tables exist before operation
    await ensureTablesExist();
    
    const sessions = await db.select({
      session: SessionSchema,
      user: UserSchema,
    })
    .from(SessionSchema)
    .innerJoin(UserSchema, eq(SessionSchema.userId, UserSchema.id))
    .where(eq(SessionSchema.token, token))
    .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const { session, user } = sessions[0];

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await db.delete(SessionSchema).where(eq(SessionSchema.id, session.id));
      return null;
    }

    return { 
      user: { id: user.id, name: user.name, email: user.email },
      session: { token: session.token, expiresAt: session.expiresAt }
    };
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}