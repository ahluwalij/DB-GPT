"use client";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { Tooltip } from "@/components/ui/tooltip";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { SidebarGroupContent } from "@/components/ui/sidebar";
import { SidebarGroup } from "@/components/ui/sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";

export function AppSidebarMenus() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const functions = [
    {
      key: 'chat',
      name: 'New Chat',
      icon: (
        <img 
          src="/uagi-icon.svg" 
          alt="UAGI" 
          className={`h-5 w-5 ${
            pathname.startsWith('/chat') || pathname === '/' 
              ? 'text-blue-700' 
              : 'text-gray-600'
          }`}
        />
      ),
      path: '/chat',
      isActive: pathname.startsWith('/chat') || pathname === '/',
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {functions.map((item) => (
            <SidebarMenuItem key={item.key}>
              <Link href={item.path}>
                <SidebarMenuButton 
                  className={`font-medium transition-all duration-200 rounded-lg px-3 py-2.5 ${
                    item.isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  isActive={item.isActive}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm">{item.name}</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}