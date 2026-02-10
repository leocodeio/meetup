"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ProjectWithStats } from "@/types/project";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search,
  Grid3x3,
  List,
  FolderKanban,
  Users,
  Layers,
  FileText,
} from "lucide-react";
import { CreateProjectDialog } from "./create-project-dialog";
import { EditProjectDialog } from "./edit-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { AddProjectMemberDialog } from "./add-project-member-dialog";
import { debounce } from "@/lib/utils/debounce";
import { PermissionGate } from "@/components/auth/permission-gate";
import { OrganizationMemberRole } from "@prisma/client";

interface ProjectListProps {
  initialProjects: ProjectWithStats[];
  organizationId: string;
  organizationOwnerId: string;
  organizationName: string;
  currentUserId: string;
  userRole?: string;
  onUpdate?: () => void;
}

type ViewMode = "grid" | "list";

export function ProjectList({
  initialProjects,
  organizationId,
  organizationOwnerId: _organizationOwnerId,
  organizationName,
  currentUserId: _currentUserId,
  userRole,
  onUpdate,
}: ProjectListProps) {
  const t = useTranslations("Dashboard.projects");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState(initialProjects);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      setSearchQuery(query);
      if (query.trim() === "") {
        setProjects(initialProjects);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/projects?orgId=${organizationId}&query=${encodeURIComponent(query)}&limit=100`
        );
        if (response.ok) {
          const data = await response.json();
          setProjects(data.data?.projects || []);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [initialProjects, organizationId]
  );

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    onUpdate?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="pl-10"
            disabled={isSearching}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label={t("gridView")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label={t("listView")}
          >
            <List className="h-4 w-4" />
          </Button>
          <PermissionGate
            permission="project:create"
            role={userRole as OrganizationMemberRole | "OWNER"}
          >
            <CreateProjectDialog
              organizationId={organizationId}
              organizationName={organizationName}
              onSuccess={handleRefresh}
            />
          </PermissionGate>
        </div>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {searchQuery ? t("noResults") : t("empty")}
          </p>
          {!searchQuery && (
            <PermissionGate
              permission="project:create"
              role={userRole as OrganizationMemberRole | "OWNER"}
            >
              <CreateProjectDialog
                organizationId={organizationId}
                organizationName={organizationName}
                onSuccess={handleRefresh}
              />
            </PermissionGate>
          )}
        </div>
      )}

      {viewMode === "grid" && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              role={userRole as OrganizationMemberRole | "OWNER"}
              onUpdate={handleRefresh}
            />
          ))}
        </div>
      )}

      {viewMode === "list" && filteredProjects.length > 0 && (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              role={userRole as OrganizationMemberRole | "OWNER"}
              onUpdate={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  role,
  onUpdate,
}: {
  project: ProjectWithStats;
  role: OrganizationMemberRole | "OWNER";
  onUpdate: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("Dashboard.projects");

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 border-border/50">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-muted/50">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] leading-snug truncate text-foreground">
            {project.name}
          </h3>

          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {project.description || ""}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {project.memberCount}
            </div>
            <span className="text-xs text-muted-foreground">•</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="h-3 w-3" />
              {project.sprintCount}
            </div>
            <span className="text-xs text-muted-foreground">•</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              {project.storyCount}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => router.push(`/dashboard/projects/${project.id}/sprints`)}
            >
              <Layers className="h-3 w-3 mr-1.5" />
              {t("manageSprints")}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <PermissionGate
            permission="project:edit"
            role={role}
          >
            <AddProjectMemberDialog
              projectId={project.id}
              onSuccess={onUpdate}
            />
            <EditProjectDialog project={project} onSuccess={onUpdate} />
          </PermissionGate>
          <PermissionGate
            permission="project:delete"
            role={role}
          >
            <DeleteProjectDialog project={project} onSuccess={onUpdate} />
          </PermissionGate>
        </div>
      </div>
    </Card>
  );
}

function ProjectListItem({
  project,
  role,
  onUpdate,
}: {
  project: ProjectWithStats;
  role: OrganizationMemberRole | "OWNER";
  onUpdate: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("Dashboard.projects");

  return (
    <Card className="p-4 hover:shadow-sm transition-all duration-200 border-border/50">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-muted/50">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] leading-snug truncate text-foreground">
            {project.name}
          </h3>

          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {project.description || ""}
          </p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="font-medium">{project.memberCount}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="h-3 w-3" />
              <span className="font-medium">{project.sprintCount}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span className="font-medium">{project.storyCount}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => router.push(`/dashboard/projects/${project.id}/sprints`)}
          >
            <Layers className="h-3 w-3 mr-1.5" />
            {t("manageSprints")}
          </Button>

          <div className="flex items-center gap-1">
            <PermissionGate
              permission="project:edit"
              role={role}
            >
              <AddProjectMemberDialog
                projectId={project.id}
                onSuccess={onUpdate}
              />
              <EditProjectDialog project={project} onSuccess={onUpdate} />
            </PermissionGate>
            <PermissionGate
              permission="project:delete"
              role={role}
            >
              <DeleteProjectDialog project={project} onSuccess={onUpdate} />
            </PermissionGate>
          </div>
        </div>
      </div>
    </Card>
  );
}
