import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "../../../lib/auth/custom-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionToken = req.cookies.session;

  if (!sessionToken) {
    return res.status(401).json({ error: "No session" });
  }

  try {
    const session = await getSession(sessionToken);
    
    if (!session) {
      return res.status(401).json({ error: "Invalid session" });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
}