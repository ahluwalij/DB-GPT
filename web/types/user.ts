import { z } from "zod";

export const UserZodSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  emailVerified: z.boolean().optional(),
  image: z.string().optional(),
  preferences: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserZodSchema>;

export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  language?: string;
  notifications?: boolean;
  [key: string]: any;
}