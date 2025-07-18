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
import { MessageSquarePlus, Edit3, Settings } from "lucide-react";

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
        <Edit3 
          className={`h-5 w-5 ${
            pathname.startsWith('/chat') || pathname === '/' 
              ? 'text-black-700' 
              : 'text-gray-600'
          }`}
        />
      ),
      path: '/chat',
      isActive: pathname.startsWith('/chat') || pathname === '/',
    },
    {
      key: 'settings',
      name: 'Settings',
      icon: (
        <Settings 
          className={`h-5 w-5 ${
            pathname.startsWith('/construct') 
              ? 'text-black-700' 
              : 'text-gray-600'
          }`}
        />
      ),
      path: '/construct/database',
      isActive: pathname.startsWith('/construct'),
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
                  className="font-medium transition-all duration-200 rounded-lg px-3 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-gray-700 hover:border hover:border-gray-200 hover:shadow-sm"
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