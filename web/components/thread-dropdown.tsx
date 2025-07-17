"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiInterceptors, delDialogue } from "@/client/api";
import { Input } from "@/components/ui/input";
import { Loader, PencilLine, Trash } from "lucide-react";
import { 
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type Props = {
  threadId: string;
  beforeTitle?: string;
  onDeleted?: () => void;
  onRenamed?: (newTitle: string) => void;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "end" | "center";
  children: React.ReactNode;
};

export function ThreadDropdown({
  threadId,
  children,
  beforeTitle,
  onDeleted,
  onRenamed,
  side = "right",
  align = "start",
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);


  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Delete the thread using the API
      const [err] = await apiInterceptors(delDialogue(threadId));
      if (err) {
        toast.error("Failed to delete thread");
        return;
      }
      
      toast.success("Thread deleted successfully");
      onDeleted?.();
      
      // Navigate away if we're currently viewing this thread
      const currentUrl = window.location.search;
      if (currentUrl.includes(threadId)) {
        router.push("/chat");
      }
    } catch (error) {
      toast.error("Failed to delete thread");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 w-[180px] bg-white border border-gray-200 shadow-lg rounded-lg text-gray-800 z-[9999]" 
          side={side} 
          align={align}
          style={{ 
            backgroundColor: 'white !important', 
            color: '#1f2937 !important',
            border: '1px solid #e5e7eb !important'
          }}
        >
          <div className="bg-white rounded-lg p-1" style={{ backgroundColor: 'white !important' }}>
            <div 
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
              onClick={() => {
                onRenamed?.(beforeTitle || "");
                setOpen(false);
              }}
              style={{ color: '#374151 !important' }}
            >
              <PencilLine className="h-4 w-4 text-gray-600" style={{ color: '#4b5563 !important' }} />
              <span className="text-sm font-medium" style={{ color: '#374151 !important' }}>Rename</span>
            </div>
            <div className="h-px bg-gray-200 my-1" style={{ backgroundColor: '#e5e7eb !important' }} />
            <div 
              className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
              onClick={() => {
                setShowDeleteDialog(true);
                setOpen(false);
              }}
              style={{ color: '#dc2626 !important' }}
            >
              <Trash className="h-4 w-4" style={{ color: '#dc2626 !important' }} />
              <span className="text-sm font-medium" style={{ color: '#dc2626 !important' }}>Delete</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>


      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Delete Thread</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}