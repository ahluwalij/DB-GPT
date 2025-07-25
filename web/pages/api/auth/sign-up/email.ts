import { NextApiRequest, NextApiResponse } from "next";
import { signUpUser } from "../../../../lib/auth/custom-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await signUpUser(email, password, name);
    
    // Set session cookie if signup was successful and includes session
    if (result.session) {
      const isSecure = process.env.NODE_ENV === "production";
      res.setHeader("Set-Cookie", [
        `session=${result.session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}${isSecure ? "; Secure" : ""}`
      ]);
    }
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Sign up error:", error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : "Failed to create user" 
    });
  }
}