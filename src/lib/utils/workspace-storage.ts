/**
 * Utility for managing workspace selection state in localStorage
 * Tracks the most recently visited org-project-sprint combination
 */

export interface WorkspaceSelection {
  organizationId: string | null;
  projectId: string | null;
  sprintId: string | null;
  timestamp: number;
}

const STORAGE_KEY = "gitsprint_recent_workspace";
const WORKSPACE_CHANGE_EVENT = "workspace-selection-changed";

/**
 * Save the current workspace selection to localStorage and dispatch event
 */
export function saveWorkspaceSelection(selection: Omit<WorkspaceSelection, "timestamp">): void {
  if (typeof window === "undefined") return;

  try {
    const workspaceData: WorkspaceSelection = {
      ...selection,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaceData));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGE_EVENT, { detail: workspaceData }));
  } catch (error) {
    console.error("Failed to save workspace selection:", error);
  }
}

/**
 * Load the most recent workspace selection from localStorage
 */
export function loadWorkspaceSelection(): WorkspaceSelection | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as WorkspaceSelection;
    
    // Validate the structure
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "timestamp" in parsed &&
      "organizationId" in parsed &&
      "projectId" in parsed &&
      "sprintId" in parsed
    ) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.error("Failed to load workspace selection:", error);
    return null;
  }
}

/**
 * Clear the workspace selection from localStorage
 */
export function clearWorkspaceSelection(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear workspace selection:", error);
  }
}

/**
 * Subscribe to workspace selection changes
 */
export function onWorkspaceSelectionChange(callback: (selection: WorkspaceSelection) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<WorkspaceSelection>;
    callback(customEvent.detail);
  };

  window.addEventListener(WORKSPACE_CHANGE_EVENT, handler);

  // Return cleanup function
  return () => {
    window.removeEventListener(WORKSPACE_CHANGE_EVENT, handler);
  };
}
