"use client";

import { SidebarGroupLabel, SidebarMenuSub } from "@/components/ui/sidebar";
import Link from "next/link";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { SidebarGroup } from "@/components/ui/sidebar";
import { ChevronDown, ChevronUp, MoreHorizontal, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ThreadDropdown } from "@/components/thread-dropdown";
import { useRequest } from "ahooks";
import { apiInterceptors, getDialogueList, delDialogue } from "@/client/api";
import { useSearchParams } from "next/navigation";
import { useSidebarRefresh } from "./sidebar-refresh-context";

type ThreadGroup = {
  label: string;
  threads: any[];
};

const MAX_THREADS_COUNT = 40;

export function AppSidebarThreads() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const chatId = searchParams?.get('id') ?? '';
  const scene = searchParams?.get('scene') ?? '';
  const { setRefreshSidebar } = useSidebarRefresh();
  
  const [generatingTitleThreadIds, setGeneratingTitleThreadIds] = useState<string[]>([]);
  
  // State to track if expanded view is active
  const [isExpanded, setIsExpanded] = useState(false);

  // Get conversation list from API
  const {
    data: dialogueList = [],
    refresh: refreshDialogList,
    loading: isLoading,
  } = useRequest(async () => {
    const response = await apiInterceptors(getDialogueList());
    return response;
  });

  // Extract thread list from API response
  const threadList = useMemo(() => {
    const [, list] = dialogueList;
    return list || [];
  }, [dialogueList]);

  // Auto-refresh when user navigates to a new conversation
  useEffect(() => {
    if (chatId) {
      refreshDialogList();
    }
  }, [chatId, refreshDialogList]);

  // Register refresh function with global context
  useEffect(() => {
    setRefreshSidebar(refreshDialogList);
  }, [refreshDialogList, setRefreshSidebar]);

  // Current thread ID for highlighting active thread
  const currentThreadId = chatId;

  // Check if we have 40 or more threads to display "View All" button
  const hasExcessThreads = threadList && threadList.length >= MAX_THREADS_COUNT;

  // Use either limited or full thread list based on expanded state
  const displayThreadList = useMemo(() => {
    if (!threadList) return [];
    return !isExpanded && hasExcessThreads
      ? threadList.slice(0, MAX_THREADS_COUNT)
      : threadList;
  }, [threadList, hasExcessThreads, isExpanded]);

  const threadGroupByDate = useMemo(() => {
    if (!displayThreadList || displayThreadList.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: ThreadGroup[] = [
      { label: "Today", threads: [] },
      { label: "Yesterday", threads: [] },
      { label: "Last Week", threads: [] },
      { label: "Older", threads: [] },
    ];

    displayThreadList.forEach((thread) => {
      const threadDate = new Date(thread.create_time || thread.lastMessageAt || thread.created_at);
      threadDate.setHours(0, 0, 0, 0);

      if (threadDate.getTime() === today.getTime()) {
        groups[0].threads.push(thread);
      } else if (threadDate.getTime() === yesterday.getTime()) {
        groups[1].threads.push(thread);
      } else if (threadDate.getTime() >= lastWeek.getTime()) {
        groups[2].threads.push(thread);
      } else {
        groups[3].threads.push(thread);
      }
    });

    // Filter out empty groups
    return groups.filter((group) => group.threads.length > 0);
  }, [displayThreadList]);

  const handleDeleteAllThreads = async () => {
    if (!threadList || threadList.length === 0) return;
    
    try {
      // Delete all conversations
      const deletePromises = threadList.map(thread => 
        apiInterceptors(delDialogue(thread.conv_uid))
      );
      
      const results = await Promise.all(deletePromises);
      
      // Check if any deletions failed
      const failed = results.filter(([err]) => err);
      if (failed.length > 0) {
        toast.error(`Failed to delete ${failed.length} conversations`);
      } else {
        toast.success("All conversations deleted successfully");
      }
      
      // Refresh the conversation list
      refreshDialogList();
      
      // Navigate to chat home if current conversation was deleted
      if (chatId) {
        router.push("/chat");
      }
    } catch (error) {
      console.error("Error deleting all conversations:", error);
      toast.error("Failed to delete conversations");
    }
  };

  if (isLoading || threadList?.length === 0)
    return (
      <SidebarGroup>
        <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/threads">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarGroupLabel className="">
                <h4 className="text-xs text-muted-foreground">
                  Recent Chats
                </h4>
                <div className="flex-1" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover/threads:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleDeleteAllThreads}
                    >
                      <Trash />
                      Delete All Chats
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarGroupLabel>

              {isLoading ? (
                Array.from({ length: 12 }).map(
                  (_, index) => <SidebarMenuSkeleton key={index} />,
                )
              ) : (
                <div className="px-2 py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No conversations yet
                  </p>
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );

  return (
    <>
      {threadGroupByDate.map((group, index) => {
        const isFirst = index === 0;
        return (
          <SidebarGroup key={group.label}>
            <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/threads">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarGroupLabel className="">
                    <h4 className="text-xs text-muted-foreground group-hover/threads:text-foreground transition-colors">
                      {group.label}
                    </h4>
                    <div className="flex-1" />
                    {isFirst && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="data-[state=open]:bg-input data-[state=open]:opacity-100 opacity-0 group-hover/threads:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={handleDeleteAllThreads}
                          >
                            <Trash />
                            Delete All Chats
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </SidebarGroupLabel>

                  {group.threads.map((thread) => (
                    <SidebarMenuSub
                      key={thread.conv_uid}
                      className="group/thread mr-0 border-l border-sidebar-border ml-3.5 pl-2.5 py-0.5"
                    >
                      <SidebarMenuSubItem className="group/menu-item">
                        <ThreadDropdown
                          threadId={thread.conv_uid}
                          beforeTitle={thread.user_input || thread.select_param || "New Chat"}
                          side="right"
                          onDeleted={refreshDialogList}
                        >
                          <div className="flex items-center data-[state=open]:bg-input! group-hover/thread:bg-input! rounded-lg">
                            <SidebarMenuButton
                              asChild
                              className="group-hover/thread:bg-transparent! flex-1"
                              isActive={currentThreadId === thread.conv_uid}
                            >
                              <Link
                                href={`/chat?scene=${thread.chat_mode}&id=${thread.conv_uid}`}
                                className="flex items-center w-full"
                              >
                                {generatingTitleThreadIds.includes(
                                  thread.conv_uid,
                                ) ? (
                                  <div className="truncate min-w-0 animate-pulse thread-title">
                                    {thread.user_input || thread.select_param || "New Chat"}
                                  </div>
                                ) : (
                                  <p className="truncate min-w-0 thread-title">
                                    {thread.user_input || thread.select_param || "New Chat"}
                                  </p>
                                )}
                              </Link>
                            </SidebarMenuButton>

                            <SidebarMenuAction 
                              className="data-[state=open]:bg-input data-[state=open]:opacity-100 opacity-0 group-hover/thread:opacity-100"
                              showOnHover={true}
                            >
                              <MoreHorizontal />
                            </SidebarMenuAction>
                          </div>
                        </ThreadDropdown>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  ))}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}

      {hasExcessThreads && (
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="w-full flex px-4">
              <Button
                variant="secondary"
                size="sm"
                className="w-full hover:bg-input justify-start"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <MoreHorizontal className="mr-2" />
                {isExpanded ? "Show Less Chats" : "Show All Chats"}
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
    </>
  );
}