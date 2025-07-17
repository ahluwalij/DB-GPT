"use client";

import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";

export const authClient = createAuthClient({
  fetchOptions: {
    onError(e) {
      if (e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
        return;
      }
      if (e.error.message) {
        toast.error(e.error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    },
  },
});