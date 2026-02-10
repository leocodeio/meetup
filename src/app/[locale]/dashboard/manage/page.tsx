"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/server/services/auth/auth-client";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation";
import {
  CreateOrganizationDialog,
  EditOrganizationDialog,
  DeleteOrganizationDialog,
} from "@/components/organizations";
import { ProjectList } from "@/components/projects";
import { ProjectWithStats } from "@/types/project";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  FolderKanban,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { PermissionGate } from "@/components/auth/permission-gate";
import { OrganizationMemberRole } from "@prisma/client";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface OrganizationWithExpanded {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  userRole?: string;
}

export default function ManagePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<
    OrganizationWithExpanded[]
  >([]);
  const [orgsLoading, setOrgsLoading] = useState(false);

  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Record<string, ProjectWithStats[]>>(
    {}
  );
  const [projectsLoading, setProjectsLoading] = useState<
    Record<string, boolean>
  >({});

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

  const fetchOrganizations = useCallback(async () => {
    if (!user?.id) return;

    setOrgsLoading(true);
    try {
      const response = await fetch("/api/organizations?limit=100");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.data?.organizations || []);
      } else {
        toast.error("Failed to load organizations");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to load organizations");
    } finally {
      setOrgsLoading(false);
    }
  }, [user?.id]);

  const handleOrganizationCreate = async () => {
    // Refresh organizations list after creating a new one
    await fetchOrganizations();
  };

  const handleOrganizationUpdate = async () => {
    // Efficiently update only the organizations list
    await fetchOrganizations();
  };

  const handleOrganizationDelete = async () => {
    // On delete, refresh organizations and clear expanded state/projects
    await fetchOrganizations();
    setExpandedOrgId(null);
    setProjects({});
  };

  const handleProjectUpdate = async (orgId: string) => {
    // Only refresh projects for the specific organization
    await fetchProjects(orgId);
  };

  useEffect(() => {
    if (user?.id) {
      fetchOrganizations();
    }
  }, [user?.id, fetchOrganizations]);

  const fetchProjects = async (orgId: string) => {
    setProjectsLoading((prev) => ({ ...prev, [orgId]: true }));
    try {
      const response = await fetch(`/api/projects?orgId=${orgId}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setProjects((prev) => ({
          ...prev,
          [orgId]: data.data?.projects || [],
        }));
      } else {
        toast.error("Failed to load projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setProjectsLoading((prev) => ({ ...prev, [orgId]: false }));
    }
  };

  const toggleOrganization = (orgId: string) => {
    if (expandedOrgId === orgId) {
      setExpandedOrgId(null);
    } else {
      setExpandedOrgId(orgId);
      if (!projects[orgId]) {
        fetchProjects(orgId);
      }
    }
  };

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

      <div className="flex-1 flex flex-col">
        <Header page="Manage" user={user} />

        <main className="flex-1 px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <BreadcrumbNavigation userId={user.id} />
            <section className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Organizations & Projects
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Manage your organizations and projects
                </p>
              </div>

              {orgsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <CreateOrganizationDialog
                      onSuccess={handleOrganizationCreate}
                    />
                  </div>

                  {organizations.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No organizations yet. Create one to get started!
                      </p>
                      <CreateOrganizationDialog
                        onSuccess={handleOrganizationCreate}
                      />
                    </div>
                  )}

                  {organizations.map((org) => (
                    <Card
                      key={org.id}
                      className="border-border/50 overflow-hidden"
                    >
                      <div className="p-3 sm:p-4 border-b border-border/50">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleOrganization(org.id)}
                            className="flex-shrink-0 self-start sm:self-center"
                          >
                            {expandedOrgId === org.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>

                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
                              {org.image ? (
                                <Avatar className="h-10 w-10 rounded-lg">
                                  <AvatarImage src={org.image} alt={org.name} />
                                  <AvatarFallback className="rounded-lg bg-primary/10">
                                    {org.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <Building2 className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-[15px] truncate">
                                {org.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                @{org.slug} • {org.memberCount} members (
                                {org.userRole === "OWNER"
                                  ? "Owner"
                                  : org.userRole === "ADMIN"
                                    ? "Admin"
                                    : "Member"}
                                )
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0 self-start sm:self-center">
                            <PermissionGate
                              permission="org:manage_members"
                              role={org.userRole as OrganizationMemberRole | "OWNER"}
                            >
                              <Link
                                href={`/dashboard/organizations/${org.id}/members`}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Manage Members"
                                  className="h-8 w-8 sm:h-10 sm:w-10"
                                >
                                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                              </Link>
                            </PermissionGate>

                            <PermissionGate
                              permission="org:edit"
                              role={org.userRole as OrganizationMemberRole | "OWNER"}
                            >
                              <EditOrganizationDialog
                                organization={org}
                                onSuccess={handleOrganizationUpdate}
                              />
                            </PermissionGate>

                            <PermissionGate
                              permission="org:delete"
                              role={org.userRole as OrganizationMemberRole | "OWNER"}
                            >
                              <DeleteOrganizationDialog
                                organization={org}
                                onSuccess={handleOrganizationDelete}
                              />
                            </PermissionGate>
                          </div>
                        </div>
                      </div>

                      {expandedOrgId === org.id && (
                        <div className="p-4 bg-muted/30">
                          <div className="flex items-center gap-2 mb-4">
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold">Projects</h3>
                          </div>

                          {projectsLoading[org.id] ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Loading projects...
                              </p>
                            </div>
                          ) : (
                            <ProjectList
                              initialProjects={projects[org.id] || []}
                              organizationId={org.id}
                              organizationOwnerId={org.ownerId}
                              organizationName={org.name}
                              currentUserId={user.id}
                              userRole={org.userRole}
                              onUpdate={() => handleProjectUpdate(org.id)}
                            />
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
