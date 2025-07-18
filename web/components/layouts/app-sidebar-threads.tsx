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
    const groups: ThreadGroup[] = [
      { label: "Today", threads: [] },
      { label: "Last 7 Days", threads: [] },
      { label: "Older", threads: [] },
    ];

    // For now, put all threads in "Today" section since we don't have timestamp data
    // This achieves the user's goal of showing the three sections like better-chatbot
    if (displayThreadList && displayThreadList.length > 0) {
      groups[0].threads = [...displayThreadList];
    }

    // Always return all groups, even if empty (like better-chatbot)
    return groups;
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

  if (isLoading)
    return (
      <SidebarGroup>
        <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/threads">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarGroupLabel className="px-3 py-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Recent Chats
                </h4>
                <div className="flex-1" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover/threads:opacity-100 transition-opacity hover:bg-gray-100 rounded-md"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="bg-white border border-gray-200 shadow-lg rounded-lg"
                    style={{ 
                      backgroundColor: 'white !important', 
                      color: '#1f2937 !important',
                      border: '1px solid #e5e7eb !important'
                    }}
                  >
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleDeleteAllThreads}
                      className="text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      style={{ color: '#dc2626 !important' }}
                    >
                      <Trash className="h-4 w-4 mr-2" style={{ color: '#dc2626 !important' }} />
                      <span style={{ color: '#dc2626 !important' }}>Delete All Chats</span>
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
      {threadGroupByDate.filter(group => group.threads.length > 0).map((group, index) => {
        const isFirst = index === 0;
        return (
          <SidebarGroup key={group.label}>
            <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/threads">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarGroupLabel className="px-3 py-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover/threads:text-gray-700 transition-colors">
                      {group.label}
                    </h4>
                    <div className="flex-1" />
                    {isFirst && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 data-[state=open]:bg-gray-100 data-[state=open]:opacity-100 opacity-0 group-hover/threads:opacity-100 transition-opacity hover:bg-gray-100 rounded-md"
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          className="bg-white border border-gray-200 shadow-lg rounded-lg"
                          style={{ 
                            backgroundColor: 'white !important', 
                            color: '#1f2937 !important',
                            border: '1px solid #e5e7eb !important'
                          }}
                        >
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={handleDeleteAllThreads}
                            className="text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                            style={{ color: '#dc2626 !important' }}
                          >
                            <Trash className="h-4 w-4 mr-2" style={{ color: '#dc2626 !important' }} />
                            <span style={{ color: '#dc2626 !important' }}>Delete All Chats</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </SidebarGroupLabel>

                  {group.threads.map((thread) => (
                    <SidebarMenuSub
                      key={thread.conv_uid}
                      className="group/thread mr-0 border-l border-gray-200 ml-3 pl-3 py-1"
                    >
                      <SidebarMenuSubItem className="group/menu-item">
                        <ThreadDropdown
                          threadId={thread.conv_uid}
                          beforeTitle={thread.user_input || thread.select_param || "New Chat"}
                          side="right"
                          onDeleted={refreshDialogList}
                        >
                          <div className={`flex items-center rounded-lg transition-all duration-200 ${
                            currentThreadId === thread.conv_uid 
                              ? 'bg-gray-50 border border-gray-200' 
                              : 'group-hover/thread:bg-gray-50 hover:border hover:border-gray-200'
                          }`}>
                            <SidebarMenuButton
                              asChild
                              className="group-hover/thread:bg-transparent pl-2 pr-6 py-2 flex-1 min-w-0"
                              isActive={currentThreadId === thread.conv_uid}
                            >
                              <Link
                                href={`/chat?scene=${thread.chat_mode}&id=${thread.conv_uid}`}
                                className="flex items-center min-w-0 flex-1"
                              >
                                {generatingTitleThreadIds.includes(
                                  thread.conv_uid,
                                ) ? (
                                  <div className={`truncate animate-pulse thread-title text-sm ${
                                    currentThreadId === thread.conv_uid 
                                      ? 'text-black-700 font-medium' 
                                      : 'text-gray-600'
                                  }`}>
                                    {thread.user_input || thread.select_param || "New Chat"}
                                  </div>
                                ) : (
                                  <p className={`truncate thread-title text-sm ${
                                    currentThreadId === thread.conv_uid 
                                      ? 'text-black-700 font-medium' 
                                      : 'text-gray-600 group-hover/thread:text-gray-800'
                                  }`}>
                                    {thread.user_input || thread.select_param || "New Chat"}
                                  </p>
                                )}
                              </Link>
                            </SidebarMenuButton>

                            <div className="flex-shrink-0 px-1">
                              <SidebarMenuAction 
                                className="data-[state=open]:bg-gray-100 data-[state=open]:opacity-100 opacity-0 group-hover/thread:opacity-100 hover:bg-gray-100 rounded-md w-6 h-6 flex items-center justify-center"
                                showOnHover={true}
                              >
                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                              </SidebarMenuAction>
                            </div>
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
            <div className="w-full flex px-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <MoreHorizontal className="mr-2 h-4 w-4" />
                <span className="text-sm">{isExpanded ? "Show Less Chats" : "Show All Chats"}</span>
                <div className="ml-auto">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
    </>
  );
}