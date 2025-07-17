import { betterAuth } from "better-auth";

// Test with minimal configuration
export const minimalAuth = betterAuth({
  secret: "test-secret",
  baseURL: "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
  },
});