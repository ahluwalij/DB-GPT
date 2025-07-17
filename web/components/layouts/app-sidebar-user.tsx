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
  User,
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
              className="data-[state=open]:bg-gray-100 data-[state=open]:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 transition-all duration-200 shadow-sm"
              size={"lg"}
            >
              <Avatar className="rounded-full size-8 border border-gray-200">
                <AvatarFallback className="bg-gray-100">
                  <User className="size-4 text-gray-600" />
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-gray-700 font-medium">{userInfo?.email || userInfo?.name || "User"}</span>
              <ChevronsUpDown className="ml-auto text-gray-400" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="bg-white border border-gray-200 shadow-lg w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-lg"
            align="center"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full border border-gray-200">
                  <AvatarFallback className="rounded-lg bg-gray-100">
                    <User className="size-4 text-gray-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-gray-800">{userInfo?.name || "User"}</span>
                  <span className="truncate text-xs text-gray-500">
                    {userInfo?.email || "user@example.com"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 hover:bg-red-50 rounded-md mx-1">
              <LogOutIcon className="size-4 text-red-600 mr-2" />
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