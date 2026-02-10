"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStorySchema } from "@/lib/validations/story";
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
import { Plus, Loader2, X, Paperclip, File, FileText, Image as ImageIcon, Download, Sparkles } from "lucide-react";
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
import { Priority, StoryStatus } from "@prisma/client";
import type { z } from "zod";
import { UserMultiSelect } from "@/components/ui/user-multi-select";
import { RichTextEditor } from "@/components/rich-text-editor";

interface CreateStoryDialogProps {
  projectId: string;
  sprintId?: string;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
  defaultStatus?: StoryStatus;
  trigger?: React.ReactNode;
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

type CreateStoryFormData = z.infer<typeof createStorySchema>;

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

export function CreateStoryDialog({
  projectId,
  sprintId,
  onSuccess,
  onOpenChange,
  defaultStatus,
  trigger,
}: CreateStoryDialogProps) {
  const t = useTranslations("Dashboard.stories");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dueDate, setDueDate] = useState<Date>();
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<StoryAttachment[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<StoryAttachment | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateStoryFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createStorySchema) as any,
    defaultValues: {
      projectId,
      sprintId: sprintId || null,
      priority: Priority.MEDIUM,
      status: defaultStatus || StoryStatus.TODO,
      labels: [],
    },
  });

  const title = watch("title");
  const priority = watch("priority");
  const status = watch("status");

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
        setValue("description", data.description);
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

  const onSubmit = async (data: CreateStoryFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/stories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          dueDate: dueDate?.toISOString(),
          assigneeIds,
          attachments,
        }),
      });

      if (response.ok) {
        toast.success(t("createSuccess"));
        handleOpenChange(false);
        reset();
        setDueDate(undefined);
        setAssigneeIds([]);
        setAttachments([]);
        onSuccess?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t("createError"));
      }
    } catch (error) {
      console.error("Failed to create story:", error);
      toast.error(t("createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t("create")}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent
          className="w-[95vw] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-labelledby="create-story-title"
          aria-describedby="create-story-description"
        >
          <DialogHeader id="create-story-title">
            <DialogTitle>{t("create")}</DialogTitle>
            <DialogDescription id="create-story-description">{t("subtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
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

            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">{t("description")}</Label>
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
                  {isGeneratingDescription ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
              <div className="h-[200px] sm:h-[250px] lg:h-[300px]">
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value ?? undefined}
                      onChange={(_, html) => field.onChange(html)}
                      placeholder={t("descriptionPlaceholder")}
                      disabled={isSubmitting || isGeneratingDescription}
                    />
                  )}
                />
              </div>
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <Paperclip className="h-4 w-4" />
                  <span>Attachments ({attachments.length})</span>
                </div>
              </div>

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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">{t("priority")}</Label>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setValue("priority", value as Priority)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="status">{t("status")}</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setValue("status", value as StoryStatus)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="points">{t("points")}</Label>
                <Input
                  id="points"
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
            </div>

            <div className="space-y-2">
              <Label>{t("assignees")}</Label>
              <UserMultiSelect
                projectId={projectId}
                value={assigneeIds}
                onChange={setAssigneeIds}
                disabled={isSubmitting}
                placeholder={t("assigneesPlaceholder")}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? t("creating") : t("save")}
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
