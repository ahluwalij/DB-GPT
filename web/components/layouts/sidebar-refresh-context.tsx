"use client";

import { createContext, useContext, useRef } from "react";

interface SidebarRefreshContextType {
  refreshSidebar: () => void;
  setRefreshSidebar: (fn: () => void) => void;
}

const SidebarRefreshContext = createContext<SidebarRefreshContextType>({
  refreshSidebar: () => {},
  setRefreshSidebar: () => {},
});

export const SidebarRefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const refreshFnRef = useRef<() => void>(() => {});

  const refreshSidebar = () => {
    refreshFnRef.current();
  };

  const setRefreshSidebar = (fn: () => void) => {
    refreshFnRef.current = fn;
  };

  return (
    <SidebarRefreshContext.Provider value={{ refreshSidebar, setRefreshSidebar }}>
      {children}
    </SidebarRefreshContext.Provider>
  );
};

export const useSidebarRefresh = () => {
  const context = useContext(SidebarRefreshContext);
  if (!context) {
    throw new Error("useSidebarRefresh must be used within a SidebarRefreshProvider");
  }
  return context;
};