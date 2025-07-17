import { toast } from "sonner";

export function handleErrorWithToast(error: any) {
  if (error.message) {
    toast.error(error.message);
  } else if (error.statusText) {
    toast.error(error.statusText);
  } else {
    toast.error("An unexpected error occurred");
  }
}