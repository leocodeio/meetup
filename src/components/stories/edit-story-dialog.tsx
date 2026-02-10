"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStorySchema } from "@/lib/validations/story";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Maximize2, 
  Minimize2, 
  Pencil, 
  Loader2, 
  X, 
  Paperclip, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Sparkles, 
  Share2,
  FileText as DetailsIcon,
  MessageSquare as CommentsIcon,
  ScrollText
} from "lucide-react";
import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Priority, StoryStatus, OrganizationMemberRole } from "@prisma/client";
import type { StoryWithAssignees } from "@/types/story";
import { StoryComments } from "@/components/stories/story-comments";
import type { z } from "zod";
import { UserMultiSelect } from "@/components/ui/user-multi-select";
import { RichTextEditor } from "@/components/rich-text-editor";
import { getStoryShareUrl } from "@/lib/utils/urls";
import { Badge } from "@/components/ui/badge";

type StoryAttachment = {
  url: string;
  name: string;
  key?: string;
  size?: number;
  type?: 'image' | 'file';
};

type UploadedFile = {
  url?: string;
  ufsUrl?: string;
  name: string;
  key?: string;
  size?: number;
  serverData?: {
    url?: string;
    name?: string;
    key?: string;
    size?: number;
  };
};

interface EditStoryDialogProps {
  story: StoryWithAssignees;
  projectId: string;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  trigger?: React.ReactNode;
  mode?: 'dialog' | 'page';
  returnUrl?: string;
  userRole?: OrganizationMemberRole;
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(name: string, type?: string) {
  if (type === 'image' || name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <ImageIcon className="h-4 w-4" />;
  if (name.endsWith('.pdf')) return <FileText className="h-4 w-4" />;
  if (name.match(/\.(doc|docx|txt)$/i)) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

type UpdateStoryFormData = z.infer<typeof updateStorySchema>;

type Section = 'details' | 'comments';

export function EditStoryDialog({
  story,
  projectId,
  onSuccess,
  onOpenChange,
  isOpen,
  trigger,
  mode = 'dialog',
  returnUrl,
}: EditStoryDialogProps) {
  const t = useTranslations("Dashboard.stories");
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  // Internal state for uncontrolled usage
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise internal state
  const open = isOpen !== undefined ? isOpen : internalOpen;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    story.dueDate ? new Date(story.dueDate) : undefined
  );
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    story.assignees.map((a) => a.user.id)
  );
  const [attachments, setAttachments] = useState<StoryAttachment[]>(() => {
    if (Array.isArray(story.attachments)) return story.attachments as StoryAttachment[];
    if (story.attachments && typeof story.attachments === 'object') {
      return Object.values(story.attachments) as StoryAttachment[];
    }
    return [];
  });
  const [selectedAttachment, setSelectedAttachment] = useState<StoryAttachment | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [localDescription, setLocalDescription] = useState<string>(story.description || "");
  const [activeSection, setActiveSection] = useState<Section>('details');

  const detailsRef = useRef<HTMLDivElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateStoryFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateStorySchema) as any,
    defaultValues: {
      title: story.title,
      description: story.description,
      points: story.points,
      priority: story.priority,
      status: story.status,
      sprintId: story.sprintId,
    },
  });

  const title = watch("title");
  const priority = watch("priority");
  const status = watch("status");

  // Handle dialog open/close state changes
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    // If in page mode and closing, navigate to return URL
    if (!nextOpen && mode === 'page' && returnUrl) {
      router.push(returnUrl);
      return;
    }

    setInternalOpen(nextOpen);
    if (!nextOpen) {
      setIsFullscreen(false);
    }
    onOpenChange?.(nextOpen);
  }, [mode, returnUrl, router, onOpenChange]);

  // Scroll to section
  const scrollToSection = (section: Section) => {
    setActiveSection(section);
    const ref = section === 'details' ? detailsRef : commentsRef;
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Share handler
  const handleShare = async () => {
    if (!story.slug) {
      toast.error("Story slug not available");
      return;
    }

    const shareUrl = getStoryShareUrl(locale, projectId, story.slug);

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Keyboard shortcuts - Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        handleOpenChange(false);
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, handleOpenChange]);

  const handleGenerateAIDescription = async () => {
    if (!title) {
      toast.error("Please enter a title first");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        const data = await response.json();
        setLocalDescription(data.description);
        toast.success("Description generated!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate description");
      }
    } catch (error) {
      console.error("AI Generation error:", error);
      toast.error("An error occurred while generating description");
    } finally {
      setIsGeneratingDescription(false);
    }
  };



  useEffect(() => {
    if (open) {
      reset({
        title: story.title,
        description: story.description,
        points: story.points,
        priority: story.priority,
        status: story.status,
        sprintId: story.sprintId,
      });
      setLocalDescription(story.description || "");
      setDueDate(story.dueDate ? new Date(story.dueDate) : undefined);
      setAssigneeIds(story.assignees.map((a) => a.user.id));
      setAttachments(() => {
        if (Array.isArray(story.attachments)) return story.attachments as StoryAttachment[];
        if (story.attachments && typeof story.attachments === 'object') {
          return Object.values(story.attachments) as StoryAttachment[];
        }
        return [];
      });
      setActiveSection('details');
    }
  }, [open, story, reset]);

  const onSubmit = async (data: UpdateStoryFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories/${story.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...data,
            description: localDescription, // Use local description state instead of form data
            dueDate: dueDate?.toISOString() || null,
            assigneeIds,
            attachments,
          }),
        }
      );

      if (response.ok) {
        toast.success(t("updateSuccess"));
        handleOpenChange(false);
        onSuccess?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t("updateError"));
      }
    } catch (error) {
      console.error("Failed to update story:", error);
      toast.error(t("updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle fullscreen toggle - in page mode, navigate instead of toggling
  const handleToggleFullscreen = () => {
    if (mode === 'page' && isFullscreen && returnUrl) {
      router.push(returnUrl);
    } else {
      setIsFullscreen((prev) => !prev);
    }
  };

  // Priority badge color
  const priorityColors = {
    LOW: "bg-blue-500/10 text-blue-600 border-blue-200/50",
    MEDIUM: "bg-yellow-500/10 text-yellow-600 border-yellow-200/50",
    HIGH: "bg-red-500/10 text-red-600 border-red-200/50",
  };

  // Status badge color
  const statusColors = {
    TODO: "bg-slate-500/10 text-slate-600 border-slate-200/50",
    IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-200/50",
    DONE: "bg-green-500/10 text-green-600 border-green-200/50",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {trigger !== null && (
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </DialogTrigger>
        )}
        <DialogContent
          hideClose
          className={cn(
            "flex flex-col gap-0 overflow-hidden p-0",
            isFullscreen
              ? "h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)]"
              : "w-[95vw] sm:w-full sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] lg:max-h-[85vh]"
          )}
          aria-labelledby="edit-story-title"
          aria-describedby="edit-story-description"
        >
          {/* Header */}
          <DialogHeader id="edit-story-title" className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {story.slug || `#${story.id.slice(-4)}`}
                  </Badge>
                  <span className="text-sm text-muted-foreground">/</span>
                  <DialogTitle className="text-lg font-semibold">{t("edit")}</DialogTitle>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Share Button */}
                {story.slug && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={handleShare}
                    title="Share story link"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share link</span>
                  </Button>
                )}

                {/* Fullscreen Toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={handleToggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle fullscreen</span>
                </Button>

                {/* Close Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={() => handleOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            </div>
            <DialogDescription id="edit-story-description" className="sr-only">
              {t("subtitle")}
            </DialogDescription>
          </DialogHeader>

          {/* Main Content - Two Column Layout on Large Screens */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Left Column - Details & Comments (Scrollable) */}
            <div className="flex-1 lg:flex-[1.2] overflow-y-auto border-r lg:border-r border-b lg:border-b-0">
              {/* Navigation Tabs - Only visible on large screens */}
              <div className="hidden lg:flex sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-3 gap-2">
                <Button
                  type="button"
                  variant={activeSection === 'details' ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                  onClick={() => scrollToSection('details')}
                >
                  <ScrollText className="h-4 w-4" />
                  <span>Details</span>
                </Button>
                <Button
                  type="button"
                  variant={activeSection === 'comments' ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                  onClick={() => scrollToSection('comments')}
                >
                  <CommentsIcon className="h-4 w-4" />
                  <span>Comments</span>
                </Button>
              </div>

              <div className="p-6 space-y-8">
                {/* Details Section */}
                <div ref={detailsRef} id="details-section" className="space-y-6">
                  {/* Title Input - Mobile Only */}
                  <div className="lg:hidden space-y-2">
                    <Label htmlFor="title">{t("title_field")}</Label>
                    <Input
                      id="title"
                      placeholder={t("titlePlaceholder")}
                      {...register("title")}
                      disabled={isSubmitting}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Story Info Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <Badge variant="outline" className={cn("text-xs", status && statusColors[status])}>
                        {status ? t(`statuses.${status}`) : '—'}
                      </Badge>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Priority</p>
                      <Badge variant="outline" className={cn("text-xs", priority && priorityColors[priority])}>
                        {priority ? t(`priorities.${priority}`) : '—'}
                      </Badge>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Points</p>
                      <span className="text-sm font-medium">{watch("points") || 0}</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                      <span className="text-sm font-medium">
                        {dueDate ? format(dueDate, "MMM d") : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Description</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10 transition-colors"
                        onClick={handleGenerateAIDescription}
                        disabled={isGeneratingDescription || isSubmitting}
                      >
                        {isGeneratingDescription ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {isGeneratingDescription ? "Generating..." : "AI Generate"}
                      </Button>
                    </div>
                    <div className="h-[250px] lg:h-[300px] border rounded-lg overflow-hidden">
                      <RichTextEditor
                        value={localDescription}
                        onChange={(_, html) => {
                          setLocalDescription(html);
                        }}
                        placeholder={t("descriptionPlaceholder")}
                        disabled={isSubmitting || isGeneratingDescription}
                      />
                    </div>
                    {errors.description && (
                      <p className="text-sm text-destructive">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Attachments */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span>Attachments</span>
                      <Badge variant="secondary" className="text-xs">{attachments.length}</Badge>
                    </div>

                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((attachment, index) => {
                          const isImage = attachment.type === 'image' || attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                          return (
                            <div key={`${attachment.url}-${index}`} className="group relative">
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(
                                  "attachment-card flex items-center gap-3 p-2",
                                  isImage ? "flex-col items-start gap-2 p-1.5 w-32" : "pr-4 min-w-[160px]"
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedAttachment(attachment);
                                }}
                              >
                                <div className={cn(
                                  "attachment-preview",
                                  isImage ? "aspect-[4/3] w-full" : "h-10 w-10 shrink-0 border border-border/40"
                                )}>
                                  {isImage ? (
                                    <img
                                      src={attachment.url}
                                      alt={attachment.name}
                                      className="h-full w-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    getFileIcon(attachment.name, attachment.type)
                                  )}
                                  {isImage && (
                                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                  )}
                                </div>

                                <div className={cn("flex flex-col min-w-0 flex-1", isImage && "w-full px-1.5 pb-1")}>
                                  <span className="truncate text-foreground/90 group-hover:text-primary transition-colors font-semibold">
                                    {isImage ? `Image ${index + 1}` : attachment.name}
                                  </span>
                                  <span className="attachment-badge">
                                    {attachment.size ? formatFileSize(attachment.size) : 'File'}
                                  </span>
                                </div>

                                {!isImage && (
                                  <Download className="attachment-action h-3.5 w-3.5 text-muted-foreground/50" />
                                )}
                              </a>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setAttachments((prev) => prev.filter((_, i) => i !== index));
                                }}
                                className="focus-ring absolute -right-2 -top-2 z-10 rounded-full bg-destructive p-1 text-white opacity-0 shadow-sm transition-all hover:bg-destructive/90 group-hover:opacity-100"
                                aria-label={`Remove ${attachment.name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <UploadButton
                      endpoint="commentAttachment"
                      onClientUploadComplete={(res) => {
                        if (!res) return;
                        const newAttachments: StoryAttachment[] = res.map((file: UploadedFile) => ({
                          url: file.serverData?.url || file.ufsUrl || file.url || '',
                          name: file.name || file.serverData?.name || 'unnamed',
                          key: file.key || file.serverData?.key,
                          size: file.size || file.serverData?.size,
                          type: (file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file') as 'image' | 'file',
                        }));
                        setAttachments((prev) => {
                          const merged = [...prev, ...newAttachments];
                          if (merged.length > 5) {
                            toast.error("Maximum 5 attachments allowed");
                            return merged.slice(0, 5);
                          }
                          return merged;
                        });
                        toast.success("File uploaded");
                      }}
                      onUploadError={(error: Error) => {
                        toast.error(`Error: ${error.message}`);
                      }}
                      disabled={attachments.length >= 5}
                      appearance={{
                        button: "bg-primary/10 text-black hover:bg-primary/20 text-xs font-medium h-24 w-24 rounded-xl border-dashed border-2 border-primary/20 flex-col gap-2",
                        allowedContent: "hidden"
                      }}
                      content={{
                        button({ ready, isUploading }) {
                          if (isUploading) {
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Uploading...</span>
                              </div>
                            );
                          }
                          if (ready) return <><Paperclip className="h-5 w-5 mb-1" /><span>Add File</span></>;
                          return "Loading...";
                        }
                      }}
                    />
                  </div>

                  {/* Assignees Display */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Assignees</p>
                    <UserMultiSelect
                      projectId={projectId}
                      value={assigneeIds}
                      onChange={setAssigneeIds}
                      disabled={isSubmitting}
                      placeholder={t("assigneesPlaceholder")}
                    />
                  </div>
                </div>

                {/* Comments Section */}
                <div ref={commentsRef} id="comments-section">
                  <div className="flex items-center gap-2 mb-4">
                    <CommentsIcon className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Comments</h3>
                  </div>
                  <div className="bg-card/40 rounded-xl border border-border/60 p-5 shadow-sm">
                    <StoryComments projectId={projectId} storyId={story.id} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Form Inputs (Only on Large Screens) */}
            <div className="hidden lg:block lg:flex-1 lg:max-w-md bg-muted/20 overflow-y-auto">
              <div className="p-6 space-y-6">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Story Settings</h3>
                
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title-lg">{t("title_field")}</Label>
                  <Input
                    id="title-lg"
                    placeholder={t("titlePlaceholder")}
                    {...register("title")}
                    disabled={isSubmitting}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority-lg">{t("priority")}</Label>
                  <Select
                    value={priority}
                    onValueChange={(value) =>
                      setValue("priority", value as Priority)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="priority-lg">
                      <SelectValue placeholder={t("priority")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Priority.LOW}>
                        {t("priorities.LOW")}
                      </SelectItem>
                      <SelectItem value={Priority.MEDIUM}>
                        {t("priorities.MEDIUM")}
                      </SelectItem>
                      <SelectItem value={Priority.HIGH}>
                        {t("priorities.HIGH")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status-lg">{t("status")}</Label>
                  <Select
                    value={status}
                    onValueChange={(value) =>
                      setValue("status", value as StoryStatus)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="status-lg">
                      <SelectValue placeholder={t("status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={StoryStatus.TODO}>
                        {t("statuses.TODO")}
                      </SelectItem>
                      <SelectItem value={StoryStatus.IN_PROGRESS}>
                        {t("statuses.IN_PROGRESS")}
                      </SelectItem>
                      <SelectItem value={StoryStatus.DONE}>
                        {t("statuses.DONE")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Points */}
                <div className="space-y-2">
                  <Label htmlFor="points-lg">{t("points")}</Label>
                  <Input
                    id="points-lg"
                    type="number"
                    min="0"
                    max="100"
                    placeholder={t("pointsPlaceholder")}
                    {...register("points", { valueAsNumber: true })}
                    disabled={isSubmitting}
                  />
                  {errors.points && (
                    <p className="text-sm text-destructive">
                      {errors.points.message}
                    </p>
                  )}
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>{t("dueDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                        disabled={isSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? t("updating") : t("save")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Footer - Only on Small Screens */}
            <DialogFooter className="lg:hidden px-6 py-4 border-t gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? t("updating") : t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAttachment} onOpenChange={(open) => !open && setSelectedAttachment(null)}>
        <DialogContent hideClose className="max-w-4xl p-0 overflow-hidden bg-background/95 border-none shadow-2xl backdrop-blur-xl">
          <DialogHeader className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between w-full text-white">
              <div className="flex flex-col">
                <DialogTitle className="text-base font-semibold leading-tight">{selectedAttachment?.name}</DialogTitle>
                <span className="text-xs opacity-80">{selectedAttachment?.size ? formatFileSize(selectedAttachment.size) : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedAttachment?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Download className="h-5 w-5" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedAttachment(null)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </DialogHeader>

          <div className="relative flex items-center justify-center min-h-[400px] max-h-[85vh] w-full overflow-auto p-4 pt-20">
            {selectedAttachment?.type === 'image' || selectedAttachment?.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={selectedAttachment?.url}
                alt={selectedAttachment?.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
              />
            ) : (
              <div className="flex flex-col items-center gap-6 p-12 text-center animate-in fade-in duration-300">
                <div className="h-24 w-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                  {selectedAttachment && getFileIcon(selectedAttachment.name, selectedAttachment.type)}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{selectedAttachment?.name}</h3>
                  <p className="text-muted-foreground">{selectedAttachment?.size ? formatFileSize(selectedAttachment.size) : ""} File</p>
                </div>

              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
