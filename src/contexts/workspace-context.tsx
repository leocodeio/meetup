"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface WorkspaceContextType {
  selectedOrgId: string | null;
  selectedProjectId: string | null;
  selectedSprintId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedSprintId: (id: string | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  return (
    <WorkspaceContext.Provider
      value={{
        selectedOrgId,
        selectedProjectId,
        selectedSprintId,
        setSelectedOrgId,
        setSelectedProjectId,
        setSelectedSprintId,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
