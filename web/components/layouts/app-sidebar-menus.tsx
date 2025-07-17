"use client";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { Tooltip } from "@/components/ui/tooltip";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { SidebarGroupContent } from "@/components/ui/sidebar";
import { SidebarGroup } from "@/components/ui/sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import SafeImage from "@/components/common/SafeImage";
import { usePathname } from "next/navigation";

export function AppSidebarMenus() {
  const router = useRouter();
  const { t } = useTranslation();
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const functions = [
    {
      key: 'chat',
      name: 'Chat',
      icon: (
        <SafeImage
          key='image_chat'
          src={pathname === '/chat' || pathname === '/' ? '/pictures/chat_active.png' : '/pictures/chat.png'}
          alt='chat_image'
          width={24}
          height={24}
          priority={false}
        />
      ),
      path: '/chat',
      isActive: pathname.startsWith('/chat') || pathname === '/',
    },
    {
      key: 'construct',
      name: 'Settings',
      isActive: pathname.startsWith('/construct'),
      icon: (
        <SafeImage
          key='image_construct'
          src={pathname.startsWith('/construct') ? '/pictures/app_active.png' : '/pictures/app.png'}
          alt='construct_image'
          width={24}
          height={24}
          priority={false}
        />
      ),
      path: '/construct/database',
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem className="mb-1">
            <Link
              href="/chat"
              onClick={(e) => {
                e.preventDefault();
                setOpenMobile(false);
                router.push(`/chat`);
                router.refresh();
              }}
            >
              <SidebarMenuButton className="flex font-semibold group/new-chat bg-input/20 border border-border/40">
                <SafeImage
                  src="/pictures/chat.png"
                  alt="new chat"
                  width={16}
                  height={16}
                  priority={false}
                />
                New Chat
                <div className="flex items-center gap-1 text-xs font-medium ml-auto opacity-0 group-hover/new-chat:opacity-100 transition-opacity">
                  <span className="border w-5 h-5 flex items-center justify-center bg-accent rounded">
                    ⌘
                  </span>
                  <span className="border w-5 h-5 flex items-center justify-center bg-accent rounded">
                    N
                  </span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          
          {functions.map((item) => (
            <SidebarMenuItem key={item.key}>
              <Link href={item.path}>
                <SidebarMenuButton 
                  className="font-semibold" 
                  isActive={item.isActive}
                >
                  {item.icon}
                  {item.name}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}