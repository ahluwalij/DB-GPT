import { NextApiRequest, NextApiResponse } from "next";
import { signInUser } from "../../../../lib/auth/custom-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await signInUser(email, password);
    
    // Set session cookie
    res.setHeader('Set-Cookie', [
      `session=${result.session.token}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
    ]);
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Sign in error:", error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : "Failed to sign in" 
    });
  }
}