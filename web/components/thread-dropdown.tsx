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
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "end" | "center";
  children: React.ReactNode;
};

export function ThreadDropdown({
  threadId,
  children,
  beforeTitle,
  onDeleted,
  side = "right",
  align = "start",
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState(beforeTitle || "");
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleUpdate = async (title: string) => {
    try {
      if (!title) {
        toast.error("Title is required");
        return;
      }
      
      // TODO: Implement actual update API call
      console.log("Update thread:", threadId, "with title:", title);
      toast.success("Thread updated successfully");
      setShowRenameDialog(false);
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update thread");
    }
  };

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
        <PopoverContent className="p-0 w-[220px]" side={side} align={align}>
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  className="cursor-pointer p-0"
                  onSelect={() => {
                    setShowRenameDialog(true);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 w-full px-2 py-1.5">
                    <PencilLine className="h-4 w-4" />
                    <span>Rename</span>
                  </div>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  className="cursor-pointer p-0"
                  onSelect={() => {
                    setShowDeleteDialog(true);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 w-full px-2 py-1.5 text-red-600">
                    <Trash className="h-4 w-4" />
                    <span>Delete</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Thread</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation thread.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Enter thread title"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => handleUpdate(editTitle)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thread</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
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