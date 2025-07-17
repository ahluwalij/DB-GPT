import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Disabled - using custom auth endpoints instead
  res.status(404).json({ error: "This endpoint is disabled. Use specific auth endpoints instead." });
}