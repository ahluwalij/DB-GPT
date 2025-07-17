const { betterAuth } = require("better-auth");
const { drizzleAdapter } = require("better-auth/adapters/drizzle");
const { drizzle } = require("drizzle-orm/mysql2");
const mysql = require("mysql2/promise");

async function testAuth() {
  try {
    console.log('Testing auth configuration...');
    
    // Create database connection
    const client = mysql.createPool("mysql://root:aa123456@localhost:3306/dbgpt");
    const db = drizzle(client, { mode: "default" });
    
    // Import schema
    const schema = require('./lib/db/pg/schema.pg');
    
    // Create auth instance
    const auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: "mysql",
        schema: {
          user: schema.UserSchema,
          session: schema.SessionSchema,
          account: schema.AccountSchema,
          verification: schema.VerificationSchema,
        },
      }),
      emailAndPassword: {
        enabled: true,
        disableSignUp: false,
      },
      advanced: {
        useSecureCookies: false,
        database: {
          generateId: false,
        },
      },
    });
    
    console.log('Auth instance created successfully');
    
    // Test signup
    console.log('Testing signup...');
    const result = await auth.api.signUpEmail({
      body: {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      },
    });
    
    console.log('Signup result:', result);
    
  } catch (error) {
    console.error('Auth test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAuth();