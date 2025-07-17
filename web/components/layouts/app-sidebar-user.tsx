"use client";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenu } from "@/components/ui/sidebar";
import {
  ChevronsUpDown,
  Command,
  LogOutIcon,
  Settings2,
  Palette,
  Languages,
  Sun,
  MoonStar,
  ChevronRight,
} from "lucide-react";
import { useContext } from "react";
import { ChatContext } from "@/app/chat-context";
import { useTranslation } from "react-i18next";
import { STORAGE_THEME_KEY, STORAGE_USERINFO_KEY } from "@/utils/constants/index";

export function AppSidebarUser() {
  const { mode, setMode } = useContext(ChatContext);
  const { t } = useTranslation();

  // Get user info from localStorage
  const userInfo = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem(STORAGE_USERINFO_KEY) || '{}')
    : {};

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_USERINFO_KEY);
      window.location.href = "/";
    }
  };

  const handleToggleTheme = () => {
    // Always keep light mode
    setMode('light');
    localStorage.setItem(STORAGE_THEME_KEY, 'light');
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground bg-input/30 border"
              size={"lg"}
            >
              <Avatar className="rounded-full size-8 border">
                <AvatarImage
                  className="object-cover"
                  src={userInfo?.avatar || "/pictures/fallback.png"}
                  alt={userInfo?.name || "User"}
                />
                <AvatarFallback>{userInfo?.name?.slice(0, 1) || "U"}</AvatarFallback>
              </Avatar>
              <span className="truncate">{userInfo?.email || userInfo?.name || "User"}</span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="bg-background w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-lg"
            align="center"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={userInfo?.avatar || "/pictures/fallback.png"}
                    alt={userInfo?.name || "User"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {userInfo?.name?.slice(0, 1) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userInfo?.name || "User"}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userInfo?.email || "user@example.com"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                // TODO: Implement chat preferences
                console.log("Open chat preferences");
              }}
            >
              <Settings2 className="size-4 text-foreground" />
              <span>Chat Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                // TODO: Implement keyboard shortcuts
                console.log("Show keyboard shortcuts");
              }}
            >
              <Command className="size-4 text-foreground" />
              <span>Keyboard Shortcuts</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOutIcon className="size-4 text-foreground" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function SelectTheme() {
  const { mode, setMode } = useContext(ChatContext);

  const handleThemeChange = (theme: string) => {
    // Always keep light mode
    setMode('light');
    localStorage.setItem(STORAGE_THEME_KEY, 'light');
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className="flex items-center"
        icon={
          <>
            <span className="text-muted-foreground text-xs min-w-0 truncate">
              {mode === 'light' ? 'Light' : 'Dark'}
            </span>
            <ChevronRight className="size-4 ml-2" />
          </>
        }
      >
        <Palette className="mr-2 size-4" />
        <span className="mr-auto">Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-48">
          <DropdownMenuLabel className="text-muted-foreground w-full flex items-center">
            <span className="text-muted-foreground text-xs mr-2 select-none">
              {mode === 'light' ? 'Light' : 'Dark'}
            </span>
            <div className="flex-1" />

            <div
              onClick={() => handleThemeChange(mode === "light" ? "dark" : "light")}
              className="cursor-pointer border rounded-full flex items-center"
            >
              <div
                className={`${
                  mode === "dark" &&
                  "bg-accent ring ring-muted-foreground/40 text-foreground"
                } p-1 rounded-full`}
              >
                <MoonStar className="size-3" />
              </div>
              <div
                className={`${
                  mode === "light" &&
                  "bg-accent ring ring-muted-foreground/40 text-foreground"
                } p-1 rounded-full`}
              >
                <Sun className="size-3" />
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={mode === 'light'}
            onClick={(e) => {
              e.preventDefault();
              handleThemeChange('light');
            }}
            className="text-sm"
          >
            Light
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={mode === 'dark'}
            onClick={(e) => {
              e.preventDefault();
              handleThemeChange('dark');
            }}
            className="text-sm"
          >
            Dark
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}