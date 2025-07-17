"use client";

import { toast } from "sonner";

class CustomAuthClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/auth') {
    this.baseUrl = baseUrl;
  }

  async signUp(data: { email: string; password: string; name: string }) {
    try {
      console.log('CustomAuthClient: Making signup request to:', `${this.baseUrl}/sign-up/email`);
      console.log('CustomAuthClient: Request data:', { email: data.email, name: data.name });
      
      const response = await fetch(`${this.baseUrl}/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('CustomAuthClient: Response status:', response.status);
      console.log('CustomAuthClient: Response headers:', response.headers);

      const result = await response.json();
      console.log('CustomAuthClient: Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Sign up failed');
      }

      return result;
    } catch (error) {
      console.error('CustomAuthClient: Sign up error:', error);
      throw error;
    }
  }

  async signIn(data: { email: string; password: string }) {
    try {
      const response = await fetch(`${this.baseUrl}/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sign in failed');
      }

      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async getSession() {
    try {
      const response = await fetch(`${this.baseUrl}/session`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  async signOut() {
    try {
      // Clear session cookie
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      
      // You can also make a request to sign out endpoint if needed
      // await fetch(`${this.baseUrl}/sign-out`, { method: 'POST', credentials: 'include' });
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }
}

export const customAuthClient = new CustomAuthClient();