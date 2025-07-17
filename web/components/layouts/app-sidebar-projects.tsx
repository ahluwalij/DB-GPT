"use client";

import { SidebarGroupLabel } from "@/components/ui/sidebar";
import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SidebarGroup } from "@/components/ui/sidebar";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppSidebarProjects() {
  const handleCreateProject = () => {
    // TODO: Implement create project functionality
    console.log("Create project clicked");
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/projects">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarGroupLabel>
              <h4 className="text-xs text-muted-foreground flex items-center gap-1 group-hover/projects:text-foreground transition-colors">
                Projects
              </h4>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 opacity-0 group-hover/projects:opacity-100 transition-opacity"
                onClick={handleCreateProject}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </SidebarGroupLabel>
            
            {/* Empty state for projects */}
            <div className="px-2 py-1">
              <div 
                className="flex items-center gap-3 py-4 px-4 rounded-2xl hover:bg-input cursor-pointer transition-colors"
                onClick={handleCreateProject}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-accent">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-medium">Create a project</div>
                  <div className="text-xs text-muted-foreground">to organize ideas</div>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}