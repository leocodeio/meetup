"use client";

import { useState, useEffect } from "react";
import { StoryBoard } from "@/components/stories";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SprintDateRange } from "@/components/sprints/sprint-date-range";
import { cn } from "@/lib/utils";
import { Target, CheckCircle2, Circle, PlayCircle, XCircle } from "lucide-react";
import { SprintStatus, OrganizationMemberRole } from "@prisma/client";
import type { StoryWithAssignees } from "@/types/story";

interface SprintBoardClientProps {
  sprintId: string;
  projectId: string;
  sprintName: string;
  sprintGoal: string | null;
  sprintStatus: SprintStatus;
  sprintStartDate: Date;
  sprintEndDate: Date;
  initialStories: StoryWithAssignees[];
  userRole?: OrganizationMemberRole | null;
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

export function SprintBoardClient({
  sprintId,
  projectId,
  sprintName,
  sprintGoal,
  sprintStatus,
  sprintStartDate,
  sprintEndDate,
  initialStories,
  userRole,
}: SprintBoardClientProps) {
  const [stories, setStories] = useState(initialStories);
  const [isLoading, setIsLoading] = useState(false);

  // Sync with server-provided stories when they change
  useEffect(() => {
    setStories(initialStories);
  }, [initialStories]);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories?sprintId=${sprintId}&limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setStories(data.data?.stories || []);
      }
    } catch (error) {
      console.error("Failed to fetch stories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const todoStories = stories.filter((s) => s.status === "TODO");
  const inProgressStories = stories.filter((s) => s.status === "IN_PROGRESS");
  const doneStories = stories.filter((s) => s.status === "DONE");

  const StatusIcon = statusIcons[sprintStatus];
  const isCompleted = sprintStatus === "COMPLETED";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{sprintName}</h1>
            <Badge
              variant="secondary"
              className={cn("text-sm", statusColors[sprintStatus])}
            >
              <StatusIcon className="h-4 w-4 mr-1.5" />
              {sprintStatus}
            </Badge>
          </div>

          {sprintGoal && (
            <p className="text-muted-foreground flex items-center gap-2 mt-2">
              <Target className="h-4 w-4" />
              {sprintGoal}
            </p>
          )}

          <SprintDateRange
            startDate={new Date(sprintStartDate)}
            endDate={new Date(sprintEndDate)}
            isCompleted={isCompleted}
          />
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold">{stories.length}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {todoStories.length}
              </div>
              <div className="text-muted-foreground">To Do</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {inProgressStories.length}
              </div>
              <div className="text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {doneStories.length}
              </div>
              <div className="text-muted-foreground">Done</div>
            </div>
          </div>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading stories...</p>
        </div>
      ) : (
        <StoryBoard
          initialStories={stories.map((story) => ({
            ...story,
            assignees: story.assignees ?? [],
          }))}
          projectId={projectId}
          sprintId={sprintId}
          userRole={userRole}
          onUpdate={fetchStories}
        />
      )}
    </div>
  );
}
