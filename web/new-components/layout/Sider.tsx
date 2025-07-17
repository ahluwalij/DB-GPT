"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { useContext } from "react";
import { ChatContext } from "@/app/chat-context";
import { SidebarRefreshProvider } from "@/components/layouts/sidebar-refresh-context";

const Sider: React.FC = () => {
  const { isMenuExpand } = useContext(ChatContext);

  return (
    <SidebarRefreshProvider>
      <SidebarProvider defaultOpen={isMenuExpand}>
        <AppSidebar />
      </SidebarProvider>
    </SidebarRefreshProvider>
  );
};

export default Sider;