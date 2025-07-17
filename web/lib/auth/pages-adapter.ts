import { NextApiRequest, NextApiResponse } from "next";
import { BetterAuth } from "better-auth";

export function createPagesHandler(auth: BetterAuth) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    console.log("Pages adapter - Request:", req.method, req.url);
    console.log("Pages adapter - Body:", req.body);
    
    // Convert Next.js API request to Web API Request
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const url = `${protocol}://${host}${req.url}`;
    
    // Convert headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
    }
    
    // Handle body
    let body: string | undefined;
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      if (req.body) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        headers.set("content-type", "application/json");
      }
    }
    
    console.log("Pages adapter - Creating request with URL:", url);
    console.log("Pages adapter - Request body:", body);
    console.log("Pages adapter - Request method:", req.method);
    
    // Create Web API Request
    const request = new Request(url, {
      method: req.method || "GET",
      headers,
      body,
    });
    
    try {
      // Call the auth handler
      console.log("Pages adapter - Calling auth.handler");
      const response = await auth.handler(request);
      console.log("Pages adapter - Response status:", response.status);
      
      // Set response status
      res.status(response.status);
      
      // Set response headers
      for (const [key, value] of response.headers) {
        res.setHeader(key, value);
      }
      
      // Get response body
      const responseBody = await response.text();
      console.log("Pages adapter - Response body:", responseBody);
      
      // Send response
      if (responseBody) {
        res.send(responseBody);
      } else {
        res.end();
      }
    } catch (error) {
      console.error("Pages adapter - Auth handler error:", error);
      res.status(500).json({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
}