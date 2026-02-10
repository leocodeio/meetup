"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation"; // Use i18n router
import { getSession } from "@/server/services/auth/auth-client";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, FolderKanban, Layers, Plus, Target, Circle, PlayCircle, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { PermissionGate } from "@/components/auth/permission-gate";
import { StoryBoard, EditStoryDialog } from "@/components/stories";
import type { StoryWithAssignees } from "@/types/story";
import { saveWorkspaceSelection, loadWorkspaceSelection, onWorkspaceSelectionChange } from "@/lib/utils/workspace-storage";
import { OrganizationMemberRole } from "@prisma/client";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  userRole?: OrganizationMemberRole;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

type Story = StoryWithAssignees;

interface Sprint {
  id: string;
  name: string;
  status: string;
  goal?: string;
  startDate: string;
  endDate: string;
  stories?: Story[];
}

const statusIcons = {
  PLANNING: Circle,
  ACTIVE: PlayCircle,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

const statusColors = {
  PLANNING: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  ACTIVE: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  COMPLETED: "bg-green-500/10 text-green-600 dark:text-green-400",
  CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function DashboardPage() {
  const router = useRouter(); // i18n-aware router
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [orgsResolved, setOrgsResolved] = useState(false);
  const [projectsResolved, setProjectsResolved] = useState(false);
  const [sprintsResolved, setSprintsResolved] = useState(false);
  const [sprintResolved, setSprintResolved] = useState(false);

  const workspaceLoading = !orgsResolved || !projectsResolved || !sprintsResolved || !sprintResolved;

  // Data states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [currentOrgRole, setCurrentOrgRole] = useState<OrganizationMemberRole | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  // Story dialog state
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [selectedStoryForDialog, setSelectedStoryForDialog] = useState<StoryWithAssignees | null>(null);
  const [loadingStoryFromUrl, setLoadingStoryFromUrl] = useState(false);
  const [processedStorySlug, setProcessedStorySlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession();
        if (session?.data?.user) {
          setUser({
            id: session.data.user.id,
            name: session.data.user.name || "User",
            email: session.data.user.email,
            image: session.data.user.image || undefined,
          });
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Failed to get session:", error);
        toast.error("Failed to load session");
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user?.id) return;

      setOrgsResolved(false);
      setProjectsResolved(false);
      setSprintsResolved(false);
      setSprintResolved(false);

      try {
        const response = await fetch("/api/organizations?limit=100");
        if (!response.ok) {
          setOrganizations([]);
          setSelectedOrgId(null);
          toast.error("Failed to load organizations");
          setOrgsResolved(true);
          setProjectsResolved(true);
          setSprintsResolved(true);
          setSprintResolved(true);
          return;
        }

        const data = await response.json();
        const orgs = data.data?.organizations || [];
        setOrganizations(orgs);

        if (orgs.length > 0) {
          // Try to load recent workspace selection from localStorage
          const recentWorkspace = loadWorkspaceSelection();

          // Check if the recent org exists in the fetched orgs
          const recentOrgExists = recentWorkspace?.organizationId &&
            orgs.some((org: Organization) => org.id === recentWorkspace.organizationId);

          // Select the recent org if it exists, otherwise select the first one
          const orgIdToSelect = recentOrgExists ? recentWorkspace!.organizationId : orgs[0].id;
          const selectedOrg = orgs.find((org: Organization) => org.id === orgIdToSelect) || orgs[0];

          setSelectedOrgId(selectedOrg.id);
          setCurrentOrgRole(selectedOrg.userRole || "MEMBER");
          setOrgsResolved(true);
        } else {
          setSelectedOrgId(null);
          setCurrentOrgRole(null);
          setProjects([]);
          setSprints([]);
          setSelectedSprint(null);
          setSelectedProjectId(null);
          setSelectedSprintId(null);
          setOrgsResolved(true);
          setProjectsResolved(true);
          setSprintsResolved(true);
          setSprintResolved(true);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
        toast.error("Failed to load organizations");
        setOrganizations([]);
        setSelectedOrgId(null);
        setOrgsResolved(true);
        setProjectsResolved(true);
        setSprintsResolved(true);
        setSprintResolved(true);
      }
    };

    fetchOrganizations();
  }, [user?.id]);

  // Fetch projects when org is selected
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedOrgId) {
        setProjects([]);
        setSelectedProjectId(null);
        setSprints([]);
        setSelectedSprintId(null);
        setSelectedSprint(null);
        setProjectsResolved(true);
        setSprintsResolved(true);
        setSprintResolved(true);
        return;
      }

      setProjectsResolved(false);
      setSprintsResolved(false);
      setSprintResolved(false);

      try {
        const response = await fetch(`/api/projects?orgId=${selectedOrgId}&limit=100`);
        if (!response.ok) {
          setProjects([]);
          setSelectedProjectId(null);
          toast.error("Failed to load projects");
          setProjectsResolved(true);
          setSprintsResolved(true);
          setSprintResolved(true);
          return;
        }

        const data = await response.json();
        const projectList = data.data?.projects || [];
        setProjects(projectList);

        if (projectList.length > 0) {
          // Try to load recent workspace selection from localStorage
          const recentWorkspace = loadWorkspaceSelection();

          // Check if the recent project exists in the fetched projects and belongs to the current org
          const recentProjectExists = recentWorkspace?.projectId &&
            recentWorkspace.organizationId === selectedOrgId &&
            projectList.some((project: Project) => project.id === recentWorkspace.projectId);

          // Select the recent project if it exists, otherwise select the first one
          const projectIdToSelect = recentProjectExists ? recentWorkspace!.projectId : projectList[0].id;

          setSelectedProjectId(projectIdToSelect);
          setProjectsResolved(true);
          return;
        }

        setSelectedProjectId(null);
        setSprints([]);
        setSelectedSprintId(null);
        setSelectedSprint(null);
        setProjectsResolved(true);
        setSprintsResolved(true);
        setSprintResolved(true);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects");
        setProjects([]);
        setSelectedProjectId(null);
        setProjectsResolved(true);
        setSprintsResolved(true);
        setSprintResolved(true);
      }
    };

    fetchProjects();
  }, [selectedOrgId]);

  // Fetch sprints when project is selected
  useEffect(() => {
    const fetchSprints = async () => {
      if (!selectedProjectId) {
        setSprints([]);
        setSelectedSprintId(null);
        setSelectedSprint(null);
        setSprintsResolved(true);
        setSprintResolved(true);
        return;
      }

      setSprintsResolved(false);
      setSprintResolved(false);

      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/sprints?limit=100`);
        if (!response.ok) {
          setSprints([]);
          setSelectedSprintId(null);
          setSelectedSprint(null);
          toast.error("Failed to load sprints");
          setSprintsResolved(true);
          setSprintResolved(true);
          return;
        }

        const data = await response.json();
        const sprintList = data.data?.sprints || [];
        setSprints(sprintList);

        if (sprintList.length > 0) {
          // Try to load recent workspace selection from localStorage
          const recentWorkspace = loadWorkspaceSelection();

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
            sprintIdToSelect = activeSprint?.id ?? sprintList[0]?.id;
          }

          setSelectedSprintId(sprintIdToSelect);
          setSprintsResolved(true);
          if (!sprintIdToSelect) setSprintResolved(true);
        } else {
          setSelectedSprintId(null);
          setSelectedSprint(null);
          setSprintsResolved(true);
          setSprintResolved(true);
        }
      } catch (error) {
        console.error("Error fetching sprints:", error);
        toast.error("Failed to load sprints");
        setSprints([]);
        setSelectedSprintId(null);
        setSelectedSprint(null);
        setSprintsResolved(true);
        setSprintResolved(true);
      }
    };

    fetchSprints();
  }, [selectedProjectId]);

  // Fetch selected sprint details with stories
  useEffect(() => {
    const fetchSprintDetails = async () => {
      if (!selectedProjectId) {
        setSelectedSprint(null);
        setSprintResolved(true);
        return;
      }

      if (!selectedSprintId) {
        setSelectedSprint(null);
        setSprintResolved(true);
        return;
      }

      setSprintResolved(false);
      try {
        const response = await fetch(`/api/projects/${selectedProjectId}/sprints/${selectedSprintId}`);
        if (!response.ok) {
          setSelectedSprint(null);
          toast.error("Failed to load sprint");
          setSprintResolved(true);
          return;
        }

        const data = await response.json();
        setSelectedSprint(data.data?.sprint || null);
        setSprintResolved(true);
      } catch (error) {
        console.error("Error fetching sprint details:", error);
        toast.error("Failed to load sprint");
        setSelectedSprint(null);
        setSprintResolved(true);
      }
    };

    fetchSprintDetails();
  }, [selectedSprintId, selectedProjectId]);

  // Save workspace selection to localStorage whenever it changes
  // Only save when we have all three values to avoid saving incomplete states
  useEffect(() => {
    if (selectedOrgId && selectedProjectId && selectedSprintId) {
      saveWorkspaceSelection({
        organizationId: selectedOrgId,
        projectId: selectedProjectId,
        sprintId: selectedSprintId,
      });
    }
  }, [selectedOrgId, selectedProjectId, selectedSprintId]);

  // Listen for workspace selection changes from breadcrumb navigation
  useEffect(() => {
    const unsubscribe = onWorkspaceSelectionChange((selection) => {
      // Update selections if they differ from current state
      // This will trigger the fetch useEffects which will load the appropriate data

      // Handle org change
      if (selection.organizationId !== selectedOrgId) {
        if (selection.organizationId) {
          setSelectedOrgId(selection.organizationId);
          // Find and set the org role
          const org = organizations.find(o => o.id === selection.organizationId);
          if (org) {
            setCurrentOrgRole(org.userRole || "MEMBER");
          }
        }
      }

      // Handle project change (including null when org changes)
      if (selection.projectId !== selectedProjectId) {
        setSelectedProjectId(selection.projectId);
      }

      // Handle sprint change (including null when project/org changes)
      if (selection.sprintId !== selectedSprintId) {
        setSelectedSprintId(selection.sprintId);
        // Clear the selected sprint details if sprint ID is null
        if (selection.sprintId === null) {
          setSelectedSprint(null);
        }
      }
    });

    return unsubscribe;
  }, [selectedOrgId, selectedProjectId, selectedSprintId, organizations]);

  // Handle story from URL parameters
  useEffect(() => {
    const storySlug = searchParams.get('story');
    const projectIdFromUrl = searchParams.get('project');
    const orgIdFromUrl = searchParams.get('org');

    console.log('[Dashboard] Story URL params:', { storySlug, projectIdFromUrl, orgIdFromUrl, hasUser: !!user?.id });

    if (!storySlug || !projectIdFromUrl || !orgIdFromUrl || !user?.id) {
      console.log('[Dashboard] Missing params or user, skipping');
      return;
    }

    // Check if we've already processed this exact story slug
    if (processedStorySlug === storySlug) {
      console.log('[Dashboard] Already processed this story slug:', storySlug);
      return;
    }

    // Check if we're already loading
    if (loadingStoryFromUrl) {
      console.log('[Dashboard] Already loading, skipping');
      return;
    }

    console.log('[Dashboard] Starting to fetch story...');
    setLoadingStoryFromUrl(true);
    setProcessedStorySlug(storySlug); // Mark this slug as being processed

    // Fetch story details using the by-slug endpoint
    fetch(`/api/projects/${projectIdFromUrl}/stories/by-slug/${storySlug}`)
      .then(async (res) => {
        console.log('[Dashboard] Fetch response status:', res.status, res.ok);

        if (!res.ok) {
          console.log('[Dashboard] Response not OK, status:', res.status);
          if (res.status === 403) {
            toast.error("You don't have permission to view this story. You may not be a member of this project.");
          } else if (res.status === 404) {
            toast.error("Story not found");
          } else {
            toast.error("Failed to load story");
          }
          // Clear URL parameters and reset processed slug
          setProcessedStorySlug(null);
          router.replace('/dashboard'); // i18n router handles locale
          return;
        }

        console.log('[Dashboard] Parsing response JSON...');
        const data = await res.json();
        console.log('[Dashboard] Response data:', data);

        const story = data.data?.story;
        console.log('[Dashboard] Extracted story:', { hasStory: !!story, storyId: story?.id });

        if (!story) {
          console.log('[Dashboard] No story in response');
          toast.error("Story not found");
          setProcessedStorySlug(null);
          router.replace('/dashboard'); // i18n router handles locale
          return;
        }

        // Check if user has access to the organization
        console.log('[Dashboard] Checking org access...');
        const hasOrgAccess = organizations.some(org => org.id === orgIdFromUrl);
        console.log('[Dashboard] Has org access:', hasOrgAccess);

        if (!hasOrgAccess) {
          console.log('[Dashboard] No org access, refetching organizations...');
          // Refetch organizations in case they were just added
          const orgRes = await fetch("/api/organizations?limit=100");
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            const orgs = orgData.data?.organizations || [];
            setOrganizations(orgs);

            const hasAccessNow = orgs.some((org: Organization) => org.id === orgIdFromUrl);
            console.log('[Dashboard] Has access now:', hasAccessNow);
            if (!hasAccessNow) {
              toast.error("You are not a member of this organization");
              setProcessedStorySlug(null);
              router.replace('/dashboard'); // i18n router handles locale
              return;
            }
          } else {
            console.log('[Dashboard] Failed to refetch organizations');
            toast.error("Unable to verify organization access");
            setProcessedStorySlug(null);
            router.replace('/dashboard'); // i18n router handles locale
            return;
          }
        }

        console.log('[Dashboard] Setting workspace context...');
        // Set workspace context to load the correct org/project/sprint
        if (orgIdFromUrl !== selectedOrgId) {
          const org = organizations.find(o => o.id === orgIdFromUrl);
          if (org) {
            console.log('[Dashboard] Setting org:', orgIdFromUrl);
            setSelectedOrgId(orgIdFromUrl);
            setCurrentOrgRole(org.userRole || "MEMBER");
          }
        }
        if (projectIdFromUrl !== selectedProjectId) {
          console.log('[Dashboard] Setting project:', projectIdFromUrl);
          setSelectedProjectId(projectIdFromUrl);
        }
        if (story.sprintId && story.sprintId !== selectedSprintId) {
          console.log('[Dashboard] Setting sprint:', story.sprintId);
          setSelectedSprintId(story.sprintId);
        }

        // Open story dialog
        console.log('[Dashboard] Opening story dialog...');
        setSelectedStoryForDialog(story);
        setStoryDialogOpen(true);

        // Clear URL parameters to clean up the URL
        console.log('[Dashboard] Clearing URL parameters...');
        router.replace('/dashboard', { scroll: false }); // i18n router handles locale
        console.log('[Dashboard] Story loading complete!');
      })
      .catch((error) => {
        console.error("[Dashboard] Error loading story from URL:", error);
        toast.error("Failed to load story");
        setProcessedStorySlug(null);
        router.replace('/dashboard'); // i18n router handles locale
      })
      .finally(() => {
        console.log('[Dashboard] Finally - setting loading to false');
        setLoadingStoryFromUrl(false);
      });
  }, [searchParams, user?.id, selectedOrgId, selectedProjectId, selectedSprintId, router, loadingStoryFromUrl, organizations, processedStorySlug, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col w-full min-w-0">
        <Header page="Dashboard" user={user} />

        <main className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
              <BreadcrumbNavigation userId={user.id} />

            </div>

            {workspaceLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  Loading your workspace...
                </p>
              </div>
            ) : (
              <section className="space-y-6">
                {/* Dynamic content based on data */}
                {organizations.length === 0 ? (
                  // No organizations
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="p-2.5 sm:p-3 rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg sm:text-xl">Get Started</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            Create your first organization to begin
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <p className="text-sm text-muted-foreground mb-4">
                        Organizations help you manage teams and projects in one
                        place.
                      </p>
                      <Link href="/dashboard/manage">
                        <Button className="w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Organization
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : projects.length === 0 ? (
                  // Has org but no projects
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="p-2.5 sm:p-3 rounded-lg bg-primary/10">
                          <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg sm:text-xl">Create Your First Project</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            Start organizing your work
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <p className="text-sm text-muted-foreground mb-4">
                        Projects help you organize sprints and track progress
                        across your team.
                      </p>
                      <PermissionGate
                        permission="project:create"
                        role={currentOrgRole}
                        fallback={
                          <p className="text-sm italic text-muted-foreground">
                            Contact your organization administrator to create a
                            project.
                          </p>
                        }
                      >
                        <Link href="/dashboard/manage">
                          <Button className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Project
                          </Button>
                        </Link>
                      </PermissionGate>
                    </CardContent>
                  </Card>
                ) : selectedSprint ? (
                  // Show selected sprint details
                  <SprintBoard
                    sprint={selectedSprint}
                    projectId={selectedProjectId!}
                    userRole={currentOrgRole}
                    onUpdate={() => {
                      // Refetch sprint details to get updated stories
                      if (selectedSprintId) {
                        fetch(
                          `/api/projects/${selectedProjectId}/sprints/${selectedSprintId}`
                        )
                          .then((res) => res.json())
                          .then((data) =>
                            setSelectedSprint(data.data?.sprint || null)
                          )
                          .catch((err) =>
                            console.error("Failed to refetch sprint:", err)
                          );
                      }
                    }}
                  />
                ) : sprints.length === 0 ? (
                  // Has projects but no sprints
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="p-2.5 sm:p-3 rounded-lg bg-primary/10">
                          <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg sm:text-xl">Create Your First Sprint</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            Plan and track your work in sprints
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <p className="text-sm text-muted-foreground mb-4">
                        Sprints help you break down work into manageable
                        timeboxed iterations.
                      </p>
                      <PermissionGate
                        permission="project:edit"
                        role={currentOrgRole}
                        fallback={
                          <p className="text-sm italic text-muted-foreground">
                            Contact your organization administrator to create a
                            sprint.
                          </p>
                        }
                      >
                        <Link href="/dashboard/manage">
                          <Button className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Sprint
                          </Button>
                        </Link>
                      </PermissionGate>
                    </CardContent>
                  </Card>
                ) : null}
              </section>
            )}
          </div>
        </main>
      </div>

      {/* Story Dialog */}
      {(() => {
        console.log('[Dashboard] Rendering - selectedStoryForDialog:', !!selectedStoryForDialog, 'selectedProjectId:', !!selectedProjectId, 'storyDialogOpen:', storyDialogOpen);
        if (selectedStoryForDialog && selectedProjectId) {
          console.log('[Dashboard] Rendering EditStoryDialog with story:', selectedStoryForDialog.slug);
        }
        return selectedStoryForDialog && selectedProjectId ? (
          <EditStoryDialog
            story={selectedStoryForDialog}
            projectId={selectedProjectId}
            isOpen={storyDialogOpen}
            onOpenChange={(open) => {
              console.log('[Dashboard] Dialog onOpenChange:', open);
              setStoryDialogOpen(open);
              if (!open) {
                console.log('[Dashboard] Closing dialog, clearing story state');
                setSelectedStoryForDialog(null);
                setProcessedStorySlug(null); // Reset so the same story can be opened again
                // Stay on dashboard, don't navigate away
              }
            }}
            onSuccess={() => {
              console.log('[Dashboard] Story updated successfully');
              // Refetch sprint/stories if we have a sprint selected
              if (selectedSprintId && selectedProjectId) {
                fetch(`/api/projects/${selectedProjectId}/sprints/${selectedSprintId}`)
                  .then((res) => res.json())
                  .then((data) => setSelectedSprint(data.data?.sprint || null))
                  .catch((err) => console.error("Failed to refetch sprint:", err));
              }
            }}
          />
        ) : null;
      })()}
    </div>
  );
}

function SprintBoard({
  sprint,
  projectId,
  userRole,
  onUpdate,
}: {
  sprint: Sprint;
  projectId: string;
  userRole: OrganizationMemberRole | null;
  onUpdate?: () => void;
}) {
  const StatusIcon =
    statusIcons[sprint.status as keyof typeof statusIcons] || Circle;

  const stories = sprint.stories || [];
  const todoStories = stories.filter((s) => s.status === "TODO");
  const inProgressStories = stories.filter((s) => s.status === "IN_PROGRESS");
  const doneStories = stories.filter((s) => s.status === "DONE");

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ... previous content ... */}
      <div className="flex flex-col gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-3 mb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words">
                {sprint.name}
              </h1>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs sm:text-sm w-fit",
                  statusColors[sprint.status as keyof typeof statusColors]
                )}
              >
                <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                {sprint.status}
              </Badge>
            </div>

            {sprint.goal && (
              <p className="text-sm sm:text-base text-muted-foreground flex items-start gap-2">
                <Target className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="break-words leading-relaxed">{sprint.goal}</span>
              </p>
            )}

            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <span className="whitespace-nowrap">
                {new Date(sprint.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>→</span>
              <span className="whitespace-nowrap">
                {new Date(sprint.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <Card className="p-4 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">
                {stories.length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                Total
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-gray-400">
                {todoStories.length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                To Do
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                {inProgressStories.length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                In Progress
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                {doneStories.length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                Done
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Kanban Board */}
      <StoryBoard
        initialStories={stories.map((story) => ({
          ...story,
          assignees: story.assignees ?? [],
        }))}
        projectId={projectId}
        sprintId={sprint.id}
        userRole={userRole}
        onUpdate={onUpdate}
      />
    </div>
  );
}

