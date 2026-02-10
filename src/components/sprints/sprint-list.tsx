"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { SprintWithStats } from "@/types/sprint";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Grid3x3,
  List,
  Layers,
  Calendar,
  Target,
  CheckCircle2,
  Circle,
  PlayCircle,
  XCircle,
} from "lucide-react";
import { CreateSprintDialog } from "./create-sprint-dialog";
import { EditSprintDialog } from "./edit-sprint-dialog";
import { DeleteSprintDialog } from "./delete-sprint-dialog";
import { debounce } from "@/lib/utils/debounce";
import { useTranslations } from "next-intl";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { PermissionGate } from "@/components/auth/permission-gate";
import { OrganizationMemberRole } from "@prisma/client";

interface SprintListProps {
  initialSprints: SprintWithStats[];
  projectId: string;
  projectName: string;
  userRole?: OrganizationMemberRole | null;
  onUpdate?: () => void;
}

type ViewMode = "grid" | "list";

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

export function SprintList({
  initialSprints,
  projectId,
  projectName,
  userRole,
  onUpdate,
}: SprintListProps) {
  const router = useRouter();
  const t = useTranslations("Dashboard.sprints");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sprints, setSprints] = useState(initialSprints);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setSprints(initialSprints);
  }, [initialSprints]);

  const debouncedSearch = useMemo(
    () => debounce(async (query: string) => {
      setSearchQuery(query);
      if (query.trim() === "") {
        setSprints(initialSprints);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/projects/${projectId}/sprints?limit=100`
        );
        if (response.ok) {
          const data = await response.json();
          const filteredSprints = (data.data?.sprints || []).filter(
            (sprint: SprintWithStats) =>
              sprint.name.toLowerCase().includes(query.toLowerCase())
          );
          setSprints(filteredSprints);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [initialSprints, projectId]
  );

  const filteredSprints = sprints.filter((sprint) =>
    sprint.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    onUpdate?.();
  };

  const handleSprintClick = (sprintId: string) => {
    router.push(`/dashboard/projects/${projectId}/sprints/${sprintId}`);
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
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label={t("gridView")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label={t("listView")}
          >
            <List className="h-4 w-4" />
          </Button>
          <PermissionGate
            permission="sprint:create"
            role={userRole}
          >
            <CreateSprintDialog
              projectId={projectId}
              projectName={projectName}
              onSuccess={handleRefresh}
            />
          </PermissionGate>
        </div>
      </div>

      {filteredSprints.length === 0 && (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {searchQuery ? t("noResults") : t("empty")}
          </p>
          {!searchQuery && (
            <PermissionGate
              permission="sprint:create"
              role={userRole}
            >
              <CreateSprintDialog
                projectId={projectId}
                projectName={projectName}
                onSuccess={handleRefresh}
              />
            </PermissionGate>
          )}
        </div>
      )}

      {viewMode === "grid" && filteredSprints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              role={userRole}
              onUpdate={handleRefresh}
              onClick={() => handleSprintClick(sprint.id)}
              t={t}
            />
          ))}
        </div>
      )}

      {viewMode === "list" && filteredSprints.length > 0 && (
        <div className="space-y-2">
          {filteredSprints.map((sprint) => (
            <SprintListItem
              key={sprint.id}
              sprint={sprint}
              role={userRole}
              onUpdate={handleRefresh}
              onClick={() => handleSprintClick(sprint.id)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SprintCard({
  sprint,
  role,
  onUpdate,
  onClick,
  t,
}: {
  sprint: SprintWithStats;
  role: OrganizationMemberRole | "OWNER" | null | undefined;
  onUpdate: () => void;
  onClick: () => void;
  t: (key: string) => string;
}) {
  const StatusIcon = statusIcons[sprint.status];
  const today = new Date();
  const endDate = new Date(sprint.endDate);
  const daysLeft = differenceInDays(endDate, today);
  const isOverdue = daysLeft < 0;
  const isCompleted = sprint.status === "COMPLETED";

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 border-border/50 cursor-pointer group">
      <div className="flex items-start gap-4" onClick={onClick}>
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-muted/50">
            <Layers className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[15px] leading-snug truncate text-foreground group-hover:text-primary transition-colors">
              {sprint.name}
            </h3>
          </div>

          <Badge
            variant="secondary"
            className={cn("text-xs mb-2", statusColors[sprint.status])}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {t(`statuses.${sprint.status}`)}
          </Badge>

          {sprint.goal && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              <Target className="h-3 w-3 inline mr-1" />
              {sprint.goal}
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(sprint.startDate), "MMM d")} -{" "}
              {format(endDate, "MMM d, yyyy")}
            </span>
          </div>

          {!isCompleted && (
            <div className="text-xs text-muted-foreground mb-2">
              {isOverdue ? (
                <span className="text-destructive font-medium">
                  {Math.abs(daysLeft)} {t("stats.daysOverdue")}
                </span>
              ) : (
                <span>
                  {daysLeft} {t("stats.daysLeft")}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-medium">{sprint.storyCount}</span>
              <span className="text-muted-foreground">{t("stats.stories")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{sprint.todoCount}</span>
              <span className="text-muted-foreground">{t("stats.todo")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{sprint.inProgressCount}</span>
              <span className="text-muted-foreground">
                {t("stats.inProgress")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{sprint.doneCount}</span>
              <span className="text-muted-foreground">{t("stats.done")}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-1 mt-3 pt-3 border-t border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <PermissionGate
          permission="sprint:edit"
          role={role}
        >
          <EditSprintDialog sprint={sprint} onSuccess={onUpdate} />
        </PermissionGate>
        <PermissionGate
          permission="sprint:delete"
          role={role}
        >
          <DeleteSprintDialog sprint={sprint} onSuccess={onUpdate} />
        </PermissionGate>
      </div>
    </Card>
  );
}

function SprintListItem({
  sprint,
  role,
  onUpdate,
  onClick,
  t,
}: {
  sprint: SprintWithStats;
  role: OrganizationMemberRole | "OWNER" | null | undefined;
  onUpdate: () => void;
  onClick: () => void;
  t: (key: string) => string;
}) {
  const StatusIcon = statusIcons[sprint.status];
  const today = new Date();
  const endDate = new Date(sprint.endDate);
  const daysLeft = differenceInDays(endDate, today);
  const isOverdue = daysLeft < 0;
  const isCompleted = sprint.status === "COMPLETED";

  return (
    <Card className="p-4 hover:shadow-sm transition-all duration-200 border-border/50 cursor-pointer group">
      <div className="flex items-center gap-4" onClick={onClick}>
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-muted/50">
            <Layers className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[15px] leading-snug truncate text-foreground group-hover:text-primary transition-colors">
              {sprint.name}
            </h3>
            <Badge
              variant="secondary"
              className={cn("text-xs", statusColors[sprint.status])}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {t(`statuses.${sprint.status}`)}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(sprint.startDate), "MMM d")} -{" "}
                {format(endDate, "MMM d, yyyy")}
              </span>
            </div>
            {!isCompleted && (
              <div>
                {isOverdue ? (
                  <span className="text-destructive font-medium">
                    {Math.abs(daysLeft)} {t("stats.daysOverdue")}
                  </span>
                ) : (
                  <span>
                    {daysLeft} {t("stats.daysLeft")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-medium">{sprint.storyCount}</span>
              <span className="text-muted-foreground">{t("stats.stories")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{sprint.todoCount}</span>
              <span className="text-muted-foreground">{t("stats.todo")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{sprint.inProgressCount}</span>
              <span className="text-muted-foreground">
                {t("stats.inProgress")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{sprint.doneCount}</span>
              <span className="text-muted-foreground">{t("stats.done")}</span>
            </div>
          </div>

          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <PermissionGate
              permission="sprint:edit"
              role={role}
            >
              <EditSprintDialog sprint={sprint} onSuccess={onUpdate} />
            </PermissionGate>
            <PermissionGate
              permission="sprint:delete"
              role={role}
            >
              <DeleteSprintDialog sprint={sprint} onSuccess={onUpdate} />
            </PermissionGate>
          </div>
        </div>
      </div>
    </Card>
  );
}
