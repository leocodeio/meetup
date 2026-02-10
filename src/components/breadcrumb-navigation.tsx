"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Building2, Plus, LayoutDashboard, Settings, Mail, User, FolderKanban, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableDropdown } from "@/components/searchable-dropdown";
import { saveWorkspaceSelection, loadWorkspaceSelection } from "@/lib/utils/workspace-storage";

interface Organization {
  id: string;
  name: string;
  slug: string;
  image?: string;
  userRole?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  userRole?: string;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
  projectId: string;
  startDate: string;
  endDate: string;
}

interface BreadcrumbNavigationProps {
  userId: string;
  storySlug?: string;
}

// Map routes to sidebar items
const ROUTE_MAP = {
  "/dashboard": { label: "Dashboard", icon: LayoutDashboard },
  "/dashboard/manage": { label: "Manage", icon: Settings },
  "/dashboard/organizations/invites": { label: "Invitations", icon: Mail },
  "/profile": { label: "Profile", icon: User },
};

export function BreadcrumbNavigation({ userId, storySlug }: BreadcrumbNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  // State for data
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  // State for selections
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  // Separate loading states for each level
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [loading, setLoading] = useState(true);

  // Parse pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const locale = pathSegments[0];
  const pathWithoutLocale = "/" + pathSegments.slice(1).join("/");

  // Determine if we're on dashboard page
  const isDashboardPage = pathWithoutLocale === "/dashboard";

  // Determine root item (sidebar item)
  const getRootItem = () => {
    if (ROUTE_MAP[pathWithoutLocale as keyof typeof ROUTE_MAP]) {
      return ROUTE_MAP[pathWithoutLocale as keyof typeof ROUTE_MAP];
    }

    for (const [route, item] of Object.entries(ROUTE_MAP)) {
      if (pathWithoutLocale.startsWith(route)) {
        return item;
      }
    }

    if (pathWithoutLocale.includes("/dashboard/organizations/")) {
      return { label: "Organizations", icon: Building2 };
    }

    return { label: "Dashboard", icon: LayoutDashboard };
  };

  const rootItem = getRootItem();
  const isOrgPage = pathWithoutLocale.includes("/dashboard/organizations/") &&
    pathSegments.length > 3 &&
    pathSegments[3] !== "invites";
  const orgIdFromUrl = isOrgPage ? pathSegments[3] : null;

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!userId) return;

      setLoadingOrgs(true);
      try {
        const response = await fetch("/api/organizations?limit=100");
        if (response.ok) {
          const data = await response.json();
          const orgs = data.data?.organizations || [];
          setOrganizations(orgs);

          // Load recent workspace selection from localStorage
          const recentWorkspace = loadWorkspaceSelection();
          
          // Auto-select org if on dashboard page
          if (isDashboardPage && !selectedOrgId && orgs.length > 0) {
            // Check if the recent org exists in the fetched orgs
            const recentOrgExists = recentWorkspace?.organizationId && 
              orgs.some((org: Organization) => org.id === recentWorkspace.organizationId);
            
            // Select the recent org if it exists, otherwise select the first one
            const orgIdToSelect = recentOrgExists ? recentWorkspace!.organizationId : orgs[0].id;
            setSelectedOrgId(orgIdToSelect);
          }
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, [userId, isDashboardPage, selectedOrgId]);

  // Fetch projects when org is selected
  useEffect(() => {
    const fetchProjects = async () => {
      const orgId = orgIdFromUrl || selectedOrgId;
      if (!orgId) {
        setProjects([]);
        setLoadingProjects(false);
        return;
      }

      setLoadingProjects(true);
      try {
        const response = await fetch(`/api/projects?orgId=${orgId}&limit=100`);
        if (response.ok) {
          const data = await response.json();
          const projectList = data.data?.projects || [];
          setProjects(projectList);

          // Load recent workspace selection from localStorage
          const recentWorkspace = loadWorkspaceSelection();

          // Auto-select project if on dashboard page
          if (isDashboardPage && !selectedProjectId && projectList.length > 0) {
            // Check if the recent project exists in the fetched projects and belongs to the current org
            const recentProjectExists = recentWorkspace?.projectId && 
              recentWorkspace.organizationId === orgId &&
              projectList.some((project: Project) => project.id === recentWorkspace.projectId);
            
            // Select the recent project if it exists, otherwise select the first one
            const projectIdToSelect = recentProjectExists ? recentWorkspace!.projectId : projectList[0].id;
            setSelectedProjectId(projectIdToSelect);
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [selectedOrgId, orgIdFromUrl, isDashboardPage, selectedProjectId]);

  // Fetch sprints when project is selected
  useEffect(() => {
    const fetchSprints = async () => {
      if (!selectedProjectId) {
        setSprints([]);
        setSelectedSprintId(null);
        setLoadingSprints(false);
        setLoading(false);
        return;
      }

      setLoadingSprints(true);
      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/sprints?limit=100`);
        if (response.ok) {
          const data = await response.json();
          const sprintList = data.data?.sprints || [];
          setSprints(sprintList);

          // Load recent workspace selection from localStorage
          const recentWorkspace = loadWorkspaceSelection();

          // Auto-select sprint if on dashboard page
          if (isDashboardPage && !selectedSprintId && sprintList.length > 0) {
            // Check if the recent sprint exists in the fetched sprints and belongs to the current project
            const recentSprintExists = recentWorkspace?.sprintId && 
              recentWorkspace.projectId === selectedProjectId &&
              sprintList.some((sprint: Sprint) => sprint.id === recentWorkspace.sprintId);
            
            // If recent sprint exists, use it. Otherwise, prioritize active sprint, then first sprint
            let sprintIdToSelect: string;
            if (recentSprintExists) {
              sprintIdToSelect = recentWorkspace!.sprintId!;
            } else {
              const activeSprint = sprintList.find((s: Sprint) => s.status === "ACTIVE");
              sprintIdToSelect = activeSprint?.id ?? sprintList[0].id;
            }
            
            setSelectedSprintId(sprintIdToSelect);
          }
        }
      } catch (error) {
        console.error("Error fetching sprints:", error);
      } finally {
        setLoadingSprints(false);
        setLoading(false);
      }
    };

    fetchSprints();
  }, [selectedProjectId, isDashboardPage, selectedSprintId]);

  // Fetch org details if on org page
  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (!orgIdFromUrl) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const orgResponse = await fetch(`/api/organizations/${orgIdFromUrl}`);
        if (orgResponse.ok) {
          // Update selected org if we're viewing a specific org page
          setSelectedOrgId(orgIdFromUrl);
        }
      } catch (error) {
        console.error("Error fetching organization data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgDetails();
  }, [orgIdFromUrl]);

  // Save workspace selection to localStorage when all three are selected
  // This handles the case when breadcrumb auto-selects project/sprint after data loads
  useEffect(() => {
    if (isDashboardPage && selectedOrgId && selectedProjectId && selectedSprintId) {
      saveWorkspaceSelection({
        organizationId: selectedOrgId,
        projectId: selectedProjectId,
        sprintId: selectedSprintId,
      });
    }
  }, [isDashboardPage, selectedOrgId, selectedProjectId, selectedSprintId]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedProjectId(null); // Reset project when org changes
    setSelectedSprintId(null); // Reset sprint when org changes

    // Notify dashboard that we're changing org and clearing project/sprint
    saveWorkspaceSelection({
      organizationId: orgId,
      projectId: null,
      sprintId: null,
    });

    // If on org page, navigate to new org
    if (isOrgPage) {
      router.push(`/${locale}/dashboard/organizations/${orgId}/members`);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedSprintId(null); // Reset sprint when project changes
    
    // Notify dashboard that we're changing project and clearing sprint
    if (selectedOrgId) {
      saveWorkspaceSelection({
        organizationId: selectedOrgId,
        projectId: projectId,
        sprintId: null,
      });
    }
  };

  const handleSprintChange = (sprintId: string) => {
    setSelectedSprintId(sprintId);
  };

  const getCurrentPageName = () => {
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (!lastSegment) return null;

    if (pathWithoutLocale === "/dashboard" ||
      pathWithoutLocale === "/dashboard/manage" ||
      pathWithoutLocale === "/dashboard/organizations/invites" ||
      pathWithoutLocale === "/profile") {
      return null;
    }

    return lastSegment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const currentPageName = getCurrentPageName();
  const RootIcon = rootItem.icon;

  const selectedOrg = organizations.find(org => org.id === (orgIdFromUrl || selectedOrgId));
  const selectedProject = projects.find(proj => proj.id === selectedProjectId);
  const selectedSprint = sprints.find(sprint => sprint.id === selectedSprintId);

  if (loading && (isOrgPage || isDashboardPage)) {
    return null;
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {/* Root Item (Sidebar item) */}
        <BreadcrumbItem>
          <BreadcrumbLink
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <RootIcon className="h-4 w-4" />
            <span>{rootItem.label}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Organization Dropdown - Always show on dashboard or org pages */}
        {(isDashboardPage || isOrgPage) && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {organizations.length === 0 ? (
                // Empty state - No organizations
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/${locale}/dashboard/manage`)}
                  className="h-auto py-1 px-2 hover:bg-accent gap-2 text-muted-foreground"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">No organizations</span>
                  <Plus className="h-3 w-3 ml-1" />
                </Button>
              ) : (
                <SearchableDropdown
                  items={organizations.map(org => ({
                    id: org.id,
                    name: `${org.name} [${(org.userRole || "Member").charAt(0).toUpperCase() + (org.userRole || "Member").slice(1).toLowerCase()}]`,
                    description: `@${org.slug}`,
                    image: org.image,
                  }))}
                  selectedItem={
                    selectedOrg ? {
                      id: selectedOrg.id,
                      name: `${selectedOrg.name} [${(selectedOrg.userRole || "Member").charAt(0).toUpperCase() + (selectedOrg.userRole || "Member").slice(1).toLowerCase()}]`,
                      description: `@${selectedOrg.slug}`,
                      image: selectedOrg.image,
                    } : null
                  }
                  onSelect={(item) => handleOrgChange(item.id)}
                  placeholder="Select Organization"
                  searchPlaceholder="Search organizations..."
                  emptyMessage="No organizations found."
                  itemsLabel="Your Organizations"
                  isLoading={loadingOrgs}
                  disabled={loadingOrgs}
                  onAddNew={() => router.push(`/${locale}/dashboard/manage`)}
                  addNewLabel="Create Organization"
                />
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Project Dropdown - Show on dashboard when org is selected */}
        {isDashboardPage && !loadingOrgs && selectedOrg && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {projects.length === 0 ? (
                // Empty state - No projects
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/${locale}/dashboard/manage`)}
                  className="h-auto py-1 px-2 hover:bg-accent gap-2 text-muted-foreground"
                >
                  <FolderKanban className="h-4 w-4" />
                  <span className="text-sm">No projects</span>
                  <Plus className="h-3 w-3 ml-1" />
                </Button>
              ) : (
                <SearchableDropdown
                  items={projects.map(project => ({
                    id: project.id,
                    name: `${project.name} [${(project.userRole || "Member").charAt(0).toUpperCase() + (project.userRole || "Member").slice(1).toLowerCase()}]`,
                    description: project.description,
                    icon: FolderKanban,
                  }))}
                  selectedItem={
                    selectedProject ? {
                      id: selectedProject.id,
                      name: `${selectedProject.name} [${(selectedProject.userRole || "Member").charAt(0).toUpperCase() + (selectedProject.userRole || "Member").slice(1).toLowerCase()}]`,
                      description: selectedProject.description,
                      icon: FolderKanban,
                    } : null
                  }
                  onSelect={(item) => handleProjectChange(item.id)}
                  placeholder="Select Project"
                  searchPlaceholder="Search projects..."
                  emptyMessage="No projects found."
                  itemsLabel={`Projects in ${selectedOrg.name}`}
                  isLoading={loadingProjects}
                  disabled={loadingProjects}
                  showIcon={true}
                  icon={FolderKanban}
                  onAddNew={() => router.push(`/${locale}/dashboard/manage`)}
                  addNewLabel="Create Project"
                />
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Sprint Dropdown - Show on dashboard when project is selected */}
        {isDashboardPage && !loadingOrgs && selectedOrg && !loadingProjects && selectedProject && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {!selectedProject ? (
                // No project selected
                <span className="text-sm text-muted-foreground py-1 px-2">
                  <Layers className="h-4 w-4 inline mr-2" />
                  Select project first
                </span>
              ) : sprints.length === 0 ? (
                // Empty state - No sprints
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/${locale}/dashboard/manage`)}
                  className="h-auto py-1 px-2 hover:bg-accent gap-2 text-muted-foreground"
                >
                  <Layers className="h-4 w-4" />
                  <span className="text-sm">No sprints</span>
                  <Plus className="h-3 w-3 ml-1" />
                </Button>
              ) : (
                <SearchableDropdown
                  items={sprints.map(sprint => ({
                    id: sprint.id,
                    name: sprint.name,
                    description: `${sprint.status} • ${new Date(sprint.startDate).toLocaleDateString()} - ${new Date(sprint.endDate).toLocaleDateString()}`,
                    icon: Layers,
                    badge: sprint.status,
                  }))}
                  selectedItem={
                    selectedSprint ? {
                      id: selectedSprint.id,
                      name: selectedSprint.name,
                      description: `${selectedSprint.status} • ${new Date(selectedSprint.startDate).toLocaleDateString()} - ${new Date(selectedSprint.endDate).toLocaleDateString()}`,
                      icon: Layers,
                      badge: selectedSprint.status,
                    } : null
                  }
                  onSelect={(item) => handleSprintChange(item.id)}
                  placeholder="Select Sprint"
                  searchPlaceholder="Search sprints..."
                  emptyMessage="No sprints found."
                  itemsLabel={`Sprints in ${selectedProject.name}`}
                  isLoading={loadingSprints}
                  disabled={loadingSprints}
                  showIcon={true}
                  icon={Layers}
                  onAddNew={() => router.push(`/${locale}/dashboard/manage`)}
                  addNewLabel="Create Sprint"
                />
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Current Page Name (if not at root) */}
        {currentPageName && !storySlug && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">
                {currentPageName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* Story Slug (if provided) */}
        {storySlug && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {storySlug}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
