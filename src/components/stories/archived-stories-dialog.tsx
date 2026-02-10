"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Archive, ArchiveRestore, Search, Clock, AlertCircle, Edit2 } from "lucide-react";
import { OrganizationMemberRole, StoryStatus } from "@prisma/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import type { StoryWithAssignees } from "@/types/story";
import { EditStoryDialog } from "./edit-story-dialog";
import { PermissionGate } from "@/components/auth/permission-gate";
import { hasPermission } from "@/lib/permissions";

interface ArchivedStoriesDialogProps {
  projectId: string;
  sprintId?: string;
  userRole?: OrganizationMemberRole | null;
  onUpdate?: () => void;
  trigger?: React.ReactNode;
}

const priorityColors = {
  LOW: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50",
  MEDIUM: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-900/50",
  HIGH: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/50",
};

const statusColors = {
  TODO: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  DONE: "bg-green-500/10 text-green-600 dark:text-green-400",
};

export function ArchivedStoriesDialog({
  projectId,
  sprintId,
  userRole,
  onUpdate,
  trigger,
}: ArchivedStoriesDialogProps) {
  const [open, setOpen] = useState(false);
  const [archivedStories, setArchivedStories] = useState<StoryWithAssignees[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStory, setEditingStory] = useState<StoryWithAssignees | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const canManage = userRole && hasPermission(userRole, "story:edit");

  const fetchArchivedStories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        archived: "true",
      });

      if (sprintId) {
        params.append("sprintId", sprintId);
      }

      const url = `/api/projects/${projectId}/stories?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch archived stories");
      }

      const data = await response.json();
      setArchivedStories(data.data?.stories || []);
    } catch (error) {
      console.error("Error fetching archived stories:", error);
      toast.error("Failed to load archived stories");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchArchivedStories();
    } else {
      setSearchQuery("");
    }
  };

  const handleUnarchive = async (story: StoryWithAssignees) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories/${story.id}/archive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ archived: false }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unarchive story");
      }

      toast.success("Story unarchived successfully");
      fetchArchivedStories();
      onUpdate?.();
    } catch (error) {
      console.error("Error unarchiving story:", error);
      toast.error("Failed to unarchive story");
    }
  };

  const handleEditStory = (story: StoryWithAssignees) => {
    setEditingStory(story);
    setEditDialogOpen(true);
  };

  const filteredStories = useMemo(() => {
    if (!searchQuery) return archivedStories;

    const query = searchQuery.toLowerCase();
    return archivedStories.filter((story) => {
      return (
        story.title.toLowerCase().includes(query) ||
        story.description?.toLowerCase().includes(query) ||
        story.slug?.toLowerCase().includes(query)
      );
    });
  }, [archivedStories, searchQuery]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4 mr-2" />
              Archived
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Archived Stories
            </DialogTitle>
            <DialogDescription>
              View and restore archived stories
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search archived stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Stories List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading archived stories...</p>
                </div>
              ) : filteredStories.length === 0 ? (
                <div className="text-center py-12">
                  <Archive className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No archived stories match your search" : "No archived stories"}
                  </p>
                </div>
              ) : (
                filteredStories.map((story) => (
                  <ArchivedStoryCard
                    key={story.id}
                    story={story}
                    onUnarchive={() => handleUnarchive(story)}
                    onEdit={() => handleEditStory(story)}
                    canManage={canManage || false}
                  />
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingStory && (
        <PermissionGate permission="story:edit" role={userRole}>
          <EditStoryDialog
            story={editingStory}
            projectId={projectId}
            onSuccess={() => {
              fetchArchivedStories();
              onUpdate?.();
            }}
            onOpenChange={setEditDialogOpen}
            isOpen={editDialogOpen}
            trigger={null}
          />
        </PermissionGate>
      )}
    </>
  );
}

interface ArchivedStoryCardProps {
  story: StoryWithAssignees;
  onUnarchive: () => void;
  onEdit: () => void;
  canManage?: boolean;
}

function ArchivedStoryCard({ story, onUnarchive, onEdit, canManage }: ArchivedStoryCardProps) {
  const isOverdue =
    story.dueDate &&
    isPast(new Date(story.dueDate)) &&
    story.status !== StoryStatus.DONE;

  return (
    <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title and Slug */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
            {story.slug && (
              <span className="text-xs font-mono font-medium text-muted-foreground flex-shrink-0">
                {story.slug}
              </span>
            )}
            <button
              type="button"
              onClick={onEdit}
              className={cn(
                "text-sm font-medium text-left hover:text-primary transition-colors flex-1 break-words",
                canManage ? "cursor-pointer" : "cursor-default pointer-events-none"
              )}
            >
              {story.title}
            </button>
          </div>

          {/* Description */}
          {story.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {story.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status */}
            <Badge
              variant="secondary"
              className={cn("text-xs", statusColors[story.status])}
            >
              {story.status.replace("_", " ")}
            </Badge>

            {/* Priority */}
            {story.priority && (
              <div
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1",
                  priorityColors[story.priority]
                )}
              >
                <AlertCircle className="h-3 w-3" />
                <span>{story.priority}</span>
              </div>
            )}

            {/* Due Date */}
            {story.dueDate && (
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium border px-2 py-0.5 rounded-full",
                  isOverdue
                    ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-900/50"
                    : "bg-muted/50 text-muted-foreground border-border"
                )}
              >
                <Clock className="h-3 w-3" />
                <span>{format(new Date(story.dueDate), "MMM d, yyyy")}</span>
              </div>
            )}

            {/* Points */}
            {story.points !== null && (
              <div className="text-xs font-medium text-muted-foreground border px-2 py-0.5 rounded-full bg-muted/20">
                {story.points} pts
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              title="Edit story"
              className="flex-1 sm:flex-initial"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onUnarchive}
              title="Unarchive story"
              className="flex-1 sm:flex-initial"
            >
              <ArchiveRestore className="h-4 w-4 mr-1" />
              Restore
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
