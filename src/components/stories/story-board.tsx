"use client";

import React, { useEffect, useState, useId, useMemo, useRef, useCallback, memo } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  EditStoryDialog,
  DeleteStoryDialog,
  CreateStoryDialog,
  ArchivedStoriesDialog,
} from "@/components/stories";
import { cn } from "@/lib/utils";
import {
  Layers,
  Clock,
  AlertCircle,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  Share2,
  Bell,
} from "lucide-react";
import { StoryStatus, Priority, OrganizationMemberRole } from "@prisma/client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { format, isPast, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { PermissionGate } from "@/components/auth/permission-gate";
import { hasPermission } from "@/lib/permissions";
import type { StoryWithAssignees } from "@/types/story";
import { getStoryShareUrl } from "@/lib/utils/urls";

interface StoryBoardProps {
  initialStories: StoryWithAssignees[];
  projectId: string;
  sprintId?: string;
  userRole?: OrganizationMemberRole | null;
  onUpdate?: () => void;
}

interface StoryFilters {
  search: string;
  priority: Priority | "ALL";
  status: StoryStatus | "ALL";
  assigneeId: string | "ALL";
  dateFrom: Date | null;
  dateTo: Date | null;
}

const columnOrder: StoryStatus[] = [
  StoryStatus.TODO,
  StoryStatus.IN_PROGRESS,
  StoryStatus.DONE,
];

type StoryColumns = Record<StoryStatus, string[]>;

type StoryMap = Record<string, StoryWithAssignees>;

const createBoardState = (stories: StoryWithAssignees[]) => {
  const sortedStories = [...stories].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );

  const storiesById: StoryMap = {};
  const columns: StoryColumns = {
    [StoryStatus.TODO]: [],
    [StoryStatus.IN_PROGRESS]: [],
    [StoryStatus.DONE]: [],
  };

  sortedStories.forEach((story) => {
    const normalizedStory = {
      ...story,
      assignees: story.assignees ?? [],
    };

    storiesById[story.id] = normalizedStory;
    columns[story.status].push(story.id);
  });

  return { storiesById, columns };
};

const updateStoryPositions = (
  columns: StoryColumns,
  storiesById: StoryMap
) => {
  const updatedStoriesById: StoryMap = { ...storiesById };

  columnOrder.forEach((status) => {
    columns[status].forEach((storyId, index) => {
      const story = updatedStoriesById[storyId];
      if (story) {
        updatedStoriesById[storyId] = {
          ...story,
          status,
          position: index,
        };
      }
    });
  });

  return updatedStoriesById;
};

// Sensor configuration moved outside component to avoid recreation on each render
const POINTER_SENSOR_CONFIG = {
  activationConstraint: { distance: 6 },
};

export function StoryBoard({
  initialStories,
  projectId,
  sprintId,
  userRole,
  onUpdate,
}: StoryBoardProps) {
  const canManage = userRole && (
    hasPermission(userRole, "story:create") ||
    hasPermission(userRole, "story:edit") ||
    hasPermission(userRole, "story:delete")
  );
  const t = useTranslations("Dashboard.stories");
  const id = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const originalColumnRef = useRef<StoryStatus | null>(null);

  // Consolidate initial state creation - call createBoardState once
  const initialBoardState = useMemo(() => createBoardState(initialStories), [initialStories]);
  const [storiesById, setStoriesById] = useState<StoryMap>(() => initialBoardState.storiesById);
  const [columns, setColumns] = useState<StoryColumns>(() => initialBoardState.columns);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<StoryWithAssignees | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<StoryStatus, boolean>>({
    [StoryStatus.TODO]: false,
    [StoryStatus.IN_PROGRESS]: false,
    [StoryStatus.DONE]: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<StoryFilters>({
    search: "",
    priority: "ALL",
    status: "ALL",
    assigneeId: "ALL",
    dateFrom: null,
    dateTo: null,
  });

  const toggleColumn = useCallback((status: StoryStatus) => {
    const isCurrentlyCollapsed = collapsedColumns[status];
    const willCollapse = !isCurrentlyCollapsed;

    // Check if we're on a small screen (mobile)
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;

    if (willCollapse) {
      const openColumns = columnOrder.filter((s) => !collapsedColumns[s]);
      if (openColumns.length <= 1 && openColumns.includes(status)) {
        toast.error(t("board.atLeastOneOpen"));
        return;
      }
    }

    // On small screens, collapse all other columns when opening one
    if (isSmallScreen && !willCollapse) {
      const newCollapsedState: Record<StoryStatus, boolean> = {
        [StoryStatus.TODO]: true,
        [StoryStatus.IN_PROGRESS]: true,
        [StoryStatus.DONE]: true,
      };
      newCollapsedState[status] = false;
      setCollapsedColumns(newCollapsedState);
    } else {
      // On larger screens, use normal toggle behavior
      setCollapsedColumns((prev) => ({
        ...prev,
        [status]: willCollapse,
      }));
    }
  }, [collapsedColumns, t]);

  // Extract unique assignees from all stories
  const allAssignees = useMemo(() => {
    const assigneeMap = new Map<string, { id: string; name: string; image: string | null }>();
    initialStories.forEach((story) => {
      story.assignees.forEach((assignee) => {
        if (!assigneeMap.has(assignee.user.id)) {
          assigneeMap.set(assignee.user.id, {
            id: assignee.user.id,
            name: assignee.user.name,
            image: assignee.user.image,
          });
        }
      });
    });
    return Array.from(assigneeMap.values());
  }, [initialStories]);

  // Performant filtering with useMemo
  const filteredStories = useMemo(() => {
    return initialStories.filter((story) => {
      // Filter out archived stories
      if (story.archived) return false;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = story.title.toLowerCase().includes(searchLower);
        const matchesDescription = story.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }

      // Priority filter
      if (filters.priority !== "ALL" && story.priority !== filters.priority) {
        return false;
      }

      // Status filter
      if (filters.status !== "ALL" && story.status !== filters.status) {
        return false;
      }

      // Assignee filter
      if (filters.assigneeId !== "ALL") {
        const hasAssignee = story.assignees.some(
          (assignee) => assignee.user.id === filters.assigneeId
        );
        if (!hasAssignee) return false;
      }

      // Date range filter (based on dueDate)
      if (filters.dateFrom || filters.dateTo) {
        if (!story.dueDate) return false;

        const storyDate = startOfDay(new Date(story.dueDate));

        if (filters.dateFrom && filters.dateTo) {
          const from = startOfDay(filters.dateFrom);
          const to = endOfDay(filters.dateTo);
          if (!isWithinInterval(storyDate, { start: from, end: to })) {
            return false;
          }
        } else if (filters.dateFrom) {
          const from = startOfDay(filters.dateFrom);
          if (storyDate < from) return false;
        } else if (filters.dateTo) {
          const to = endOfDay(filters.dateTo);
          if (storyDate > to) return false;
        }
      }

      return true;
    });
  }, [initialStories, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.priority !== "ALL") count++;
    if (filters.status !== "ALL") count++;
    if (filters.assigneeId !== "ALL") count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      priority: "ALL",
      status: "ALL",
      assigneeId: "ALL",
      dateFrom: null,
      dateTo: null,
    });
  }, []);

  useEffect(() => {
    setHasMounted(true);
    const nextState = createBoardState(filteredStories);
    setStoriesById(nextState.storiesById);
    setColumns(nextState.columns);

    // Initialize mobile state: collapsed except for TODO
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isSmallScreen) {
      setCollapsedColumns({
        [StoryStatus.TODO]: false,
        [StoryStatus.IN_PROGRESS]: true,
        [StoryStatus.DONE]: true,
      });
    }
  }, [filteredStories]);

  // Disable all sensors when dialog is open to prevent drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: isDialogOpen ? { distance: Infinity } : POINTER_SENSOR_CONFIG.activationConstraint,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeStory = activeId ? storiesById[activeId] : null;

  const findColumnId = useCallback((id: string) => {
    if (columnOrder.includes(id as StoryStatus)) {
      return id as StoryStatus;
    }

    return columnOrder.find((status) => columns[status].includes(id)) ?? null;
  }, [columns]);

  const persistOrder = useCallback(async (
    nextColumns: StoryColumns,
    previousColumns: StoryColumns,
    previousStoriesById: StoryMap
  ) => {
    const items = columnOrder.flatMap((status) =>
      nextColumns[status].map((storyId, index) => ({
        id: storyId,
        status,
        position: index,
      }))
    );

    if (items.length === 0) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items }),
        }
      );

      if (!response.ok) {
        setColumns(previousColumns);
        setStoriesById(previousStoriesById);
        toast.error(t("updateError"));
        return;
      }

      toast.success(t("updateSuccess"));
      // Note: We don't call onUpdate() here to avoid flickering.
      // The local state is already updated optimistically, and calling onUpdate
      // would trigger a re-fetch which resets the UI before settling.
    } catch (error) {
      console.error("Failed to update story order:", error);
      setColumns(previousColumns);
      setStoriesById(previousStoriesById);
      toast.error(t("updateError"));
    }
  }, [projectId, t]);

  const handleDragStart = useCallback((event: { active: { id: string | number } }) => {
    if (!canManage || isDialogOpen) return;
    const storyId = String(event.active.id);
    setActiveId(storyId);
    // Capture the original column at drag start before handleDragOver modifies columns state
    originalColumnRef.current = findColumnId(storyId);
  }, [canManage, isDialogOpen, findColumnId]);

  const handleDragOver = useCallback((event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) => {
    if (!canManage || isDialogOpen || !event.over) return;

    const activeStoryId = String(event.active.id);
    const overId = String(event.over.id);
    const activeColumn = findColumnId(activeStoryId);
    const overColumn = findColumnId(overId);

    if (!activeColumn || !overColumn || activeColumn === overColumn) {
      return;
    }

    setColumns((prevColumns) => {
      const activeItems = prevColumns[activeColumn].filter(
        (id) => id !== activeStoryId
      );
      const overItems = prevColumns[overColumn];
      const overIndex = overItems.indexOf(overId);
      // When dropping on a story card in another column, insert AFTER it
      // This makes dragging to the bottom-most story work correctly
      const insertIndex = overIndex >= 0 ? overIndex + 1 : overItems.length;

      return {
        ...prevColumns,
        [activeColumn]: activeItems,
        [overColumn]: [
          ...overItems.slice(0, insertIndex),
          activeStoryId,
          ...overItems.slice(insertIndex),
        ],
      };
    });

    setStoriesById((prevStories) => {
      const story = prevStories[activeStoryId];
      if (!story) return prevStories;

      return {
        ...prevStories,
        [activeStoryId]: {
          ...story,
          status: overColumn,
        },
      };
    });
  }, [canManage, isDialogOpen, findColumnId]);

  const handleDragEnd = useCallback(async (event: {
    active: { id: string | number };
    over: { id: string | number } | null;
  }) => {
    if (!canManage || isDialogOpen) {
      setActiveId(null);
      return;
    }

    const { active, over } = event;
    const previousColumns = columns;
    const previousStoriesById = storiesById;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeStoryId = String(active.id);
    const overId = String(over.id);
    // Use originalColumnRef (captured at drag start) instead of findColumnId
    // because handleDragOver may have already moved the story to the target column
    const activeColumn = originalColumnRef.current;
    const overColumn = findColumnId(overId);
    const overIsColumn = columnOrder.includes(overId as StoryStatus);

    if (!activeColumn || !overColumn) {
      setActiveId(null);
      return;
    }

    let nextColumns = columns;

    if (activeColumn === overColumn) {
      // Reordering within the same column
      if (overIsColumn) {
        setActiveId(null);
        return;
      }

      const activeIndex = columns[activeColumn].indexOf(activeStoryId);
      const overIndex = columns[overColumn].indexOf(overId);

      if (activeIndex !== overIndex && overIndex >= 0) {
        nextColumns = {
          ...columns,
          [activeColumn]: arrayMove(
            columns[activeColumn],
            activeIndex,
            overIndex
          ),
        };
      }
    } else {
      // Moving to a different column
      // handleDragOver may have already moved the item, so check if it's already in the target column
      const isAlreadyInTarget = columns[overColumn].includes(activeStoryId);

      if (!isAlreadyInTarget) {
        // If not already moved by handleDragOver, move it now
        const overItems = columns[overColumn];
        const overIndex = overItems.indexOf(overId);
        const insertIndex = overIsColumn || overIndex < 0 ? overItems.length : overIndex;

        nextColumns = {
          ...columns,
          [activeColumn]: columns[activeColumn].filter(
            (id) => id !== activeStoryId
          ),
          [overColumn]: [
            ...overItems.slice(0, insertIndex),
            activeStoryId,
            ...overItems.slice(insertIndex),
          ],
        };
      }
      // If already moved by handleDragOver, just use the current columns state
    }

    // Update positions and status for all stories in the affected columns
    const nextStoriesById = updateStoryPositions(nextColumns, storiesById);

    setColumns(nextColumns);
    setStoriesById(nextStoriesById);
    setActiveId(null);
    originalColumnRef.current = null;

    // Always persist when there's a cross-column move or reorder within column
    if (nextColumns !== previousColumns || activeColumn !== overColumn) {
      await persistOrder(nextColumns, previousColumns, previousStoriesById);
    }
  }, [canManage, isDialogOpen, columns, storiesById, findColumnId, persistOrder]);

  if (!hasMounted) return null;

  return (
    <div className="relative">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t("title")}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "relative",
                showFilters && "bg-secondary/80"
              )}
            >
              <Filter className={cn(
                "h-4 w-4 mr-2 transition-transform duration-300",
                showFilters && "rotate-180"
              )} />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs animate-in zoom-in-50 duration-200 bg-secondary-foreground/10 text-secondary-foreground"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
            <ArchivedStoriesDialog
              projectId={projectId}
              sprintId={sprintId}
              userRole={userRole}
              onUpdate={onUpdate}
            />
            <PermissionGate permission="story:create" role={userRole}>
              <CreateStoryDialog
                projectId={projectId}
                sprintId={sprintId}
                onSuccess={onUpdate}
                onOpenChange={setIsDialogOpen}
              />
            </PermissionGate>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="relative overflow-hidden border border-border bg-muted/20 shadow-sm animate-in slide-in-from-top-4 duration-300">
            <div className="relative p-6 space-y-6">
              {/* Filter Header */}
              <div className="flex items-center gap-2 pb-2">
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Filter Stories</h3>
                  <p className="text-xs text-muted-foreground">Refine your search with multiple criteria</p>
                </div>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                {/* Search */}
                <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2 group">
                  <label className="text-xs font-bold text-muted-foreground mb-2.5 block uppercase tracking-wide flex items-center gap-2">
                    <Search className="h-3.5 w-3.5" />
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <Input
                      placeholder="Search by title or description..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-9 border focus-visible:ring-secondary transition-all duration-200 bg-background"
                    />
                  </div>
                </div>

              {/* Priority Filter */}
              <div className="group">
                <label className="text-xs font-bold text-muted-foreground mb-2.5 block uppercase tracking-wide flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Priority
                </label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) =>
                    setFilters({ ...filters, priority: value as Priority | "ALL" })
                  }
                >
                  <SelectTrigger className="border focus:ring-secondary transition-all bg-background">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                        All Priorities
                      </span>
                    </SelectItem>
                    <SelectItem value={Priority.LOW}>
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value={Priority.MEDIUM}>
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value={Priority.HIGH}>
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        High
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="group">
                <label className="text-xs font-bold text-muted-foreground mb-2.5 block uppercase tracking-wide flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5" />
                  Status
                </label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value as StoryStatus | "ALL" })
                  }
                >
                  <SelectTrigger className="border focus:ring-secondary transition-all bg-background">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value={StoryStatus.TODO}>
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                        Todo
                      </span>
                    </SelectItem>
                    <SelectItem value={StoryStatus.IN_PROGRESS}>
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        In Progress
                      </span>
                    </SelectItem>
                    <SelectItem value={StoryStatus.DONE}>
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Done
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee Filter */}
              <div className="group">
                <label className="text-xs font-bold text-muted-foreground mb-2.5 block uppercase tracking-wide flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Assignee
                </label>
                <Select
                  value={filters.assigneeId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, assigneeId: value })
                  }
                >
                  <SelectTrigger className="border focus:ring-secondary transition-all bg-background">
                    <SelectValue placeholder="All Assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Team Members</SelectItem>
                    {allAssignees.map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        <span className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={assignee.image || undefined} />
                            <AvatarFallback className="text-[8px]">
                              {assignee.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {assignee.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="group">
                <label className="text-xs font-bold text-muted-foreground mb-2.5 block uppercase tracking-wide flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border bg-background",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? (
                        format(filters.dateFrom, "MMM d, yyyy")
                      ) : (
                        <span>Select date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom || undefined}
                      onSelect={(date) => setFilters({ ...filters, dateFrom: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="group">
                <label className="text-xs font-bold text-muted-foreground mb-2.5 block uppercase tracking-wide flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border bg-background",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? (
                        format(filters.dateTo, "MMM d, yyyy")
                      ) : (
                        <span>Select date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo || undefined}
                      onSelect={(date) => setFilters({ ...filters, dateTo: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 pt-4 border-t border-border/50 flex-wrap animate-in fade-in duration-300">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    Active Filters ({activeFilterCount})
                  </span>
                </div>
                {filters.search && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer group/badge border border-border/50"
                    onClick={() => setFilters({ ...filters, search: "" })}
                  >
                    <Search className="h-3 w-3" />
                    <span className="font-medium">{filters.search}</span>
                    <X className="h-3.5 w-3.5 opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                  </Badge>
                )}
                {filters.priority !== "ALL" && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer group/badge border border-border/50"
                    onClick={() => setFilters({ ...filters, priority: "ALL" })}
                  >
                    <AlertCircle className="h-3 w-3" />
                    <span className="font-medium">{filters.priority}</span>
                    <X className="h-3.5 w-3.5 opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                  </Badge>
                )}
                {filters.status !== "ALL" && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer group/badge border border-border/50"
                    onClick={() => setFilters({ ...filters, status: "ALL" })}
                  >
                    <Layers className="h-3 w-3" />
                    <span className="font-medium">{filters.status.replace('_', ' ')}</span>
                    <X className="h-3.5 w-3.5 opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                  </Badge>
                )}
                {filters.assigneeId !== "ALL" && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer group/badge border border-border/50"
                    onClick={() => setFilters({ ...filters, assigneeId: "ALL" })}
                  >
                    <Users className="h-3 w-3" />
                    <span className="font-medium">{allAssignees.find((a) => a.id === filters.assigneeId)?.name}</span>
                    <X className="h-3.5 w-3.5 opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                  </Badge>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <Badge
                    variant="secondary"
                    className="gap-1.5 pl-3 pr-2 py-1.5 hover:bg-secondary/80 transition-colors cursor-pointer group/badge border border-border/50"
                    onClick={() => setFilters({ ...filters, dateFrom: null, dateTo: null })}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    <span className="font-medium">
                      {filters.dateFrom ? format(filters.dateFrom, "MMM d") : "..."} - {filters.dateTo ? format(filters.dateTo, "MMM d") : "..."}
                    </span>
                    <X className="h-3.5 w-3.5 opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Results Summary */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary/50 border border-border/50 animate-in slide-in-from-top-2 duration-200">
          <div className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
          <span className="text-sm font-medium">
            Showing <span className="font-bold">{filteredStories.length}</span> of{" "}
            <span className="font-bold">{initialStories.length}</span> stories
          </span>
        </div>
      )}

        <div className="transition-opacity duration-200">
          <DndContext
            id={id}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:overflow-x-auto pb-4 items-stretch md:items-start min-h-[400px] md:min-h-[600px]">
              {columnOrder.map((status) => (
                <StoryColumn
                  key={status}
                  title={t(`statuses.${status}`)}
                  status={status}
                  storyIds={columns[status]}
                  storiesById={storiesById}
                  projectId={projectId}
                  sprintId={sprintId}
                  onUpdate={onUpdate}
                  t={t}
                  onDialogChange={setIsDialogOpen}
                  isCollapsed={collapsedColumns[status]}
                  onToggle={() => toggleColumn(status)}
                  isDialogOpen={isDialogOpen}
                  userRole={userRole}
                  onEditStory={setEditingStory}
                />
              ))}
            </div>

            <DragOverlay>
              {activeStory ? (
                <StoryCardContent
                  story={activeStory}
                  userRole={userRole}
                  projectId={projectId}
                  onUpdate={onUpdate}
                  t={t}
                  isOverlay
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Edit Story Dialog - Rendered at board level */}
        {editingStory && (
          <PermissionGate permission="story:edit" role={userRole}>
            <EditStoryDialog
              story={editingStory}
              projectId={projectId}
              onSuccess={() => {
                onUpdate?.();
                setEditingStory(null);
              }}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingStory(null);
                }
              }}
              isOpen={!!editingStory}
              trigger={null}
            />
          </PermissionGate>
        )}
      </div>
    </div>
  );
}

interface StoryColumnProps {
  title: string;
  status: StoryStatus;
  storyIds: string[];
  storiesById: StoryMap;
  projectId: string;
  sprintId?: string;
  onUpdate?: () => void;
  t: (key: string) => string;
  onDialogChange?: (open: boolean) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDialogOpen: boolean;
  userRole?: OrganizationMemberRole | null;
  onEditStory: (story: StoryWithAssignees) => void;
}

const StoryColumn = memo(function StoryColumn({
  title,
  status,
  storyIds,
  storiesById,
  projectId,
  sprintId,
  onUpdate,
  t,
  onDialogChange,
  isCollapsed,
  onToggle,
  isDialogOpen,
  userRole,
  onEditStory,
}: StoryColumnProps) {
  const statusColors = {
    TODO: "border-border/50 bg-muted/30 backdrop-blur-sm",
    IN_PROGRESS: "border-blue-500/20 bg-blue-500/5 backdrop-blur-sm",
    DONE: "border-green-500/20 bg-green-500/5 backdrop-blur-sm",
  };

  const titleColors = {
    TODO: "text-gray-700 dark:text-gray-300",
    IN_PROGRESS: "text-blue-700 dark:text-blue-300",
    DONE: "text-green-700 dark:text-green-300",
  };

  return (
    <SortableContext
      items={storyIds}
      strategy={verticalListSortingStrategy}
    >
      <div
        className={cn(
          "rounded-lg border-2 transition-all duration-300 ease-out relative group/column",
          statusColors[status],
          isCollapsed
            ? "w-full h-[60px] min-h-[60px] px-4 py-3 sm:px-2 sm:py-6 overflow-hidden md:w-[64px] md:min-w-[64px] md:h-auto md:min-h-[500px]"
            : "w-full p-3 sm:p-4 min-h-[300px] md:flex-1 md:min-w-[200px] lg:min-w-[280px] md:min-h-[500px]"
        )}
        data-status={status}
      >
        <StoryColumnDroppable
          status={status}
          title={title}
          storyIds={storyIds}
          storiesById={storiesById}
          projectId={projectId}
          sprintId={sprintId}
          onUpdate={onUpdate}
          t={t}
          titleColors={titleColors}
          onDialogChange={onDialogChange}
          isCollapsed={isCollapsed}
          onToggle={onToggle}
          isDialogOpen={isDialogOpen}
          userRole={userRole}
          onEditStory={onEditStory}
        />
      </div>
    </SortableContext>
  );
});

interface StoryColumnDroppableProps {
  status: StoryStatus;
  title: string;
  storyIds: string[];
  storiesById: StoryMap;
  projectId: string;
  sprintId?: string;
  onUpdate?: () => void;
  t: (key: string) => string;
  titleColors: Record<string, string>;
  onDialogChange?: (open: boolean) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isDialogOpen: boolean;
  userRole?: OrganizationMemberRole | null;
  onEditStory: (story: StoryWithAssignees) => void;
}

function StoryColumnDroppable({
  status,
  title,
  storyIds,
  storiesById,
  projectId,
  sprintId,
  onUpdate,
  t,
  titleColors,
  onDialogChange,
  isCollapsed,
  onToggle,
  isDialogOpen,
  userRole,
  onEditStory,
}: StoryColumnDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const stories = storyIds
    .map((storyId) => storiesById[storyId])
    .filter(Boolean);

  return (
    <div ref={setNodeRef} className={cn("h-full flex flex-col", isOver ? "bg-accent/40 rounded-md" : "")}>
      <div className={cn(
        "flex items-center justify-between mb-4",
        isCollapsed && "flex-col gap-4 mb-0 h-full"
      )}>
        {!isCollapsed ? (
          <>
            <h3 className={cn("font-semibold text-lg", titleColors[status])}>
              {title}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stories.length}</Badge>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground"
                title="Collapse column"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground mb-2 hidden md:block"
              title="Expand column"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="flex md:flex-col items-center gap-3 sm:gap-4 h-full w-full md:w-auto md:py-4">
              <Badge variant="secondary" className="md:mb-2 flex-shrink-0">{stories.length}</Badge>
              <h3 className={cn(
                "font-bold text-sm tracking-widest uppercase whitespace-nowrap opacity-70 group-hover/column:opacity-100 transition-opacity flex-1 md:flex-none text-left md:rotate-180 md:[writing-mode:vertical-lr]",
                titleColors[status]
              )}>
                {title}
              </h3>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground ml-auto md:hidden"
                title="Expand column"
              >
                <ChevronRight className="h-4 w-4 rotate-90 md:rotate-0" />
              </button>
            </div>
          </>
        )}
      </div>

      {!isCollapsed && (
        <div className="space-y-3">
          {stories.length === 0 ? (
            <PermissionGate permission="story:create" role={userRole}>
              <CreateStoryDialog
                projectId={projectId}
                sprintId={sprintId}
                onSuccess={onUpdate}
                onOpenChange={onDialogChange}
                defaultStatus={status}
                trigger={
                  <button
                    type="button"
                    className="w-full text-center py-8 text-muted-foreground text-sm hover:bg-accent/50 rounded-md transition-colors cursor-pointer"
                  >
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t("board.emptyColumn")}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {t("board.clickToAdd")}
                    </p>
                  </button>
                }
              />
            </PermissionGate>
          ) : (
            <div className="space-y-3">
              {stories.map((story) => (
                <SortableStoryCard
                  key={story.id}
                  story={story}
                  projectId={projectId}
                  userRole={userRole}
                  onUpdate={onUpdate}
                  t={t}
                  onDialogChange={onDialogChange}
                  isDisabled={isDialogOpen}
                  onEdit={onEditStory}
                />
              ))}
            </div>
          )}
          {stories.length === 0 && !userRole && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {t("board.emptyColumn")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface StoryCardProps {
  story: StoryWithAssignees;
  projectId: string;
  userRole?: OrganizationMemberRole | null;
  onUpdate?: () => void;
  t: (key: string) => string;
  isOverlay?: boolean;
  onDialogChange?: (open: boolean) => void;
  isDisabled?: boolean;
  onEdit?: (story: StoryWithAssignees) => void;
}

function SortableStoryCard({
  story,
  projectId,
  userRole,
  onUpdate,
  t,
  onDialogChange,
  isDisabled,
  onEdit,
}: StoryCardProps) {
  const canEdit = userRole && hasPermission(userRole, "story:edit");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: story.id, disabled: !canEdit || isDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <StoryCardContent
        story={story}
        projectId={projectId}
        userRole={userRole}
        onUpdate={onUpdate}
        t={t}
        onDialogChange={onDialogChange}
        onEdit={onEdit}
        className={
          canEdit
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-default"
        }
        isDragging={isDragging}
      />
    </div>
  );
}

const StoryCardContent = memo(function StoryCardContent({
  story,
  projectId,
  userRole,
  onUpdate,
  t,
  className,
  isDragging,
  isOverlay,
  onDialogChange,
  onEdit,
}: StoryCardProps & { className?: string; isDragging?: boolean }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const handleEdit = () => {
    onEdit?.(story);
    onDialogChange?.(true);
  };

  const isOverdue =
    story.dueDate &&
    isPast(new Date(story.dueDate)) &&
    story.status !== StoryStatus.DONE;

  const priorityColors = {
    LOW: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50",
    MEDIUM: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-900/50",
    HIGH: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/50",
  };

  const handleArchive = async () => {
    if (archiving) return;

    try {
      setArchiving(true);
      const response = await fetch(
        `/api/projects/${projectId}/stories/${story.id}/archive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ archived: true }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to archive story");
      }

      toast.success("Story archived successfully");
      onUpdate?.();
    } catch (error) {
      console.error("Error archiving story:", error);
      toast.error("Failed to archive story");
    } finally {
      setArchiving(false);
    }
  };

  const handleShare = () => {
    if (!story.slug) {
      toast.error("Cannot share story without a slug");
      return;
    }

    const url = getStoryShareUrl(locale, projectId, story.slug);
    navigator.clipboard.writeText(url);
    toast.success(t("shareSuccess") || "Link copied to clipboard");
  };

  const handleNotify = () => {
    // TODO: Enable when mail service is configured
    toast.info(t("comingSoon") || "Coming soon");
  };

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-300",
          "bg-card border-l-4 shadow-sm hover:shadow-md",
          className,
          story.status === 'DONE' ? 'border-l-green-500' :
            story.status === 'IN_PROGRESS' ? 'border-l-blue-500' : 'border-l-slate-400',
          isDragging && "opacity-50 scale-95"
        )}
      >
        <div className="flex flex-col p-3 gap-2.5">
          {/* Top Line: Drag, ID, Title, Menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <PermissionGate permission="story:edit" role={userRole}>
                {!isOverlay && (
                  <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing hover:text-muted-foreground transition-colors" />
                )}
              </PermissionGate>

              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[10px] font-mono font-medium text-muted-foreground flex-shrink-0">
                  {story.slug || `#${story.id.slice(-4)}`}
                </span>
                <button
                  type="button"
                  onClick={() => userRole && hasPermission(userRole, "story:edit") && handleEdit()}
                  className={cn(
                    "text-sm font-medium leading-snug truncate text-left hover:text-primary transition-colors",
                    userRole && hasPermission(userRole, "story:edit") ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  {story.title}
                </button>
              </div>
            </div>

            {/* Actions Menu */}
            {!isOverlay && (
              <div className="flex items-center flex-shrink-0">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <PermissionGate permission="story:edit" role={userRole}>
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        {t("edit")}
                      </DropdownMenuItem>
                    </PermissionGate>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="mr-2 h-4 w-4" />
                      {t("share") || "Share"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNotify}>
                      <Bell className="mr-2 h-4 w-4" />
                      {t("notify") || "Notify"}
                    </DropdownMenuItem>
                    <PermissionGate permission="story:edit" role={userRole}>
                      <DropdownMenuItem onClick={() => handleArchive()}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </PermissionGate>
                    <PermissionGate permission="story:delete" role={userRole}>
                      <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("delete")}
                      </DropdownMenuItem>
                    </PermissionGate>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Bottom Line: Priority, Deadline, Points, Attachments, Assignees */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority */}
              {story.priority && (
                <div className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1",
                  priorityColors[story.priority]
                )}>
                  <AlertCircle className="h-3 w-3" />
                  <span>{t(`priorities.${story.priority}`)}</span>
                </div>
              )}

              {/* Deadline */}
              {(story.dueDate || isOverdue) && (
                <div className={cn(
                  "flex items-center gap-1.5 text-[11px] font-medium border px-2 py-0.5 rounded-full",
                  isOverdue
                    ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-900/50"
                    : "bg-muted/50 text-muted-foreground border-border"
                )}>
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(story.dueDate || new Date()), "MMM d")}</span>
                </div>
              )}

              {/* Points */}
              {story.points !== null && (
                <div className="text-[11px] font-medium text-muted-foreground border px-2 py-0.5 rounded-full bg-muted/20">
                  {story.points} pts
                </div>
              )}

              {/* Attachments */}
              {!!((Array.isArray(story.attachments) && story.attachments.length > 0) || (story.attachments && typeof story.attachments === 'object' && Object.keys(story.attachments as object).length > 0)) && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground border px-2 py-0.5 rounded-full bg-muted/20">
                  <Paperclip className="h-3 w-3" />
                  <span>{Array.isArray(story.attachments) ? (story.attachments as unknown[]).length : Object.keys(story.attachments as object).length}</span>
                </div>
              )}
            </div>

            {/* Assignees */}
            {story.assignees.length > 0 && (
              <div className="flex items-center -space-x-2 pl-1 flex-shrink-0">
                {story.assignees.slice(0, 3).map((assignee) => (
                  <Avatar key={assignee.id} className="h-6 w-6 border-2 border-card ring-1 ring-border/5 transition-transform hover:z-10 hover:scale-110">
                    <AvatarImage src={assignee.user.image || undefined} />
                    <AvatarFallback className="text-[9px] bg-muted font-bold text-muted-foreground">
                      {assignee.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {story.assignees.length > 3 && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted border-2 border-card text-[9px] font-bold text-muted-foreground ring-1 ring-border/5">
                    +{story.assignees.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <PermissionGate permission="story:delete" role={userRole}>
        <DeleteStoryDialog
          story={story}
          projectId={projectId}
          onSuccess={onUpdate}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            onDialogChange?.(open);
          }}
          isOpen={deleteDialogOpen}
          trigger={null}
        />
      </PermissionGate>
    </>
  );
});

