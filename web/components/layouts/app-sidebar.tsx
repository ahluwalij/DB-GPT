"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSidebarMenus } from "./app-sidebar-menus";
import { AppSidebarThreads } from "./app-sidebar-threads";
import { AppSidebarUser } from "./app-sidebar-user";
import { PanelLeft } from "lucide-react";
import { useContext, useState } from "react";
import { ChatContext } from "@/app/chat-context";

export function AppSidebar() {
  const { toggleSidebar, setOpenMobile } = useSidebar();
  const router = useRouter();
  const { mode } = useContext(ChatContext);
  const [isMobile, setIsMobile] = useState(false);

  const currentPath = usePathname();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push("/chat");
        router.refresh();
      }
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, toggleSidebar]);

  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [currentPath, isMobile]);

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-gray-200 bg-white shadow-sm">
      <SidebarHeader className="border-b border-gray-100 bg-gray-50/50 px-4 py-3">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-center">
            <SidebarMenuButton asChild className="hover:bg-gray-100 rounded-lg transition-colors p-2">
              <Link
                href={`/chat`}
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/chat");
                  router.refresh();
                }}
              >
                <div className="flex items-center justify-center w-full">
                  <img 
                    src="/uagi-logo.svg" 
                    alt="UAGI" 
                    className="h-8 w-auto"
                  />
                </div>
                <div
                  className="absolute right-2 block sm:hidden text-gray-600 hover:text-gray-800"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMobile(false);
                  }}
                >
                  <PanelLeft className="size-4" />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-white px-2 py-4">
        <div className="flex flex-col gap-4 overflow-y-auto">
          <AppSidebarMenus />
          <AppSidebarThreads />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-100 bg-gray-50/30 px-2 py-3">
        <AppSidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}