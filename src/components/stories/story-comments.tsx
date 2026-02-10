"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { toast } from "sonner";
import { UploadButton } from "@/utils/uploadthing";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Paperclip, File, FileText, Image as ImageIcon, Download, ExternalLink, X, Loader2 } from "lucide-react";

/**
 * Format file size into human readable string
 */
function formatFileSize(bytes?: number) {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Get icon for file type/extension
 */
function getFileIcon(name: string, type?: string) {
  if (type === 'image' || name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <ImageIcon className="h-4 w-4" />;
  if (name.endsWith('.pdf')) return <FileText className="h-4 w-4" />;
  if (name.match(/\.(doc|docx|txt)$/i)) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

type UploadedFile = {
  url?: string;
  ufsUrl?: string;
  name: string;
  key?: string | null;
  size?: number;
  serverData?: {
    url?: string;
    name?: string;
    key?: string | null;
    size?: number;
  };
};

const MAX_ATTACHMENTS = 5;
const MAX_MESSAGE_LENGTH = 10000;

type CommentAttachment = {
  url: string;
  name: string;
  key?: string | null;
  size?: number;
  type?: 'image' | 'file';
};

type CommentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

type StoryComment = {
  id: string;
  content: string;
  attachments: CommentAttachment[] | null;
  user: CommentUser;
  createdAt: string;
};

interface StoryCommentsProps {
  projectId: string;
  storyId: string;
}

export function StoryComments({ projectId, storyId }: StoryCommentsProps) {
  const t = useTranslations("Dashboard.stories.details");
  const tStories = useTranslations("Dashboard.stories");
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<CommentAttachment | null>(null);
  const remainingCharacters = Math.max(
    0,
    MAX_MESSAGE_LENGTH - message.length
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachments, setAttachments] = useState<CommentAttachment[]>([]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories/${storyId}/comments`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await response.json();
      setComments(data.data?.comments ?? []);
    } catch (error) {
      console.error("Failed to load comments:", error);
      toast.error(tStories("updateError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, storyId]);

  const handleAddComment = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      toast.error(tStories("createError"));
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      toast.error(t("commentTooLong"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories/${storyId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: trimmedMessage,
            attachments,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || tStories("createError"));
        return;
      }

      const data = await response.json();
      const created = data.data?.comment as StoryComment | undefined;
      if (created) {
        setComments((prev) => [created, ...prev]);
      } else {
        await fetchComments();
      }
      setMessage("");
      setAttachments([]);
      setIsExpanded(false);
      toast.success(tStories("createSuccess"));
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error(tStories("createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadComplete = (
    res:
      | Array<{ url: string; name: string; key: string | null; size: number }>
      | undefined
  ) => {
    if (!res || res.length === 0) {
      return;
    }

    const nextAttachments: CommentAttachment[] = res.map((file: UploadedFile) => {
      const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      return {
        url: file.serverData?.url || file.ufsUrl || file.url || '',
        name: file.name || file.serverData?.name || 'unnamed',
        key: file.key || file.serverData?.key,
        size: file.size || file.serverData?.size,
        type: (isImage ? 'image' : 'file') as 'image' | 'file',
      };
    });

    setAttachments((prev) => {
      const merged = [...prev, ...nextAttachments];
      if (merged.length > MAX_ATTACHMENTS) {
        toast.error(t("attachmentLimit"));
        return merged.slice(0, MAX_ATTACHMENTS);
      }
      return merged;
    });


  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, current) => current !== index));
  };

  const attachmentLabel = useMemo(() => {
    if (attachments.length === 0) {
      return null;
    }
    return `${attachments.length} attachment${attachments.length === 1 ? "" : "s"
      }`;
  }, [attachments.length]);

  return (
    <div className="rounded-xl border border-border/40 bg-muted/10 p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {t("comments")}
          </h3>
          <p className="text-sm text-muted-foreground">
            Join the conversation
          </p>
        </div>
      </div>

      <div
        className={cn(
          "transition-all duration-200 rounded-xl border border-border/80 bg-background shadow-sm overflow-hidden",
          !isExpanded && "cursor-pointer hover:border-border hover:bg-muted/5"
        )}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        {!isExpanded ? (
          <div className="px-5 py-3 flex items-center justify-between text-muted-foreground transition-colors group">
            <span className="text-sm leading-6">{t("addComment")}...</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Click to write</span>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("addComment")}
                disabled={isSubmitting}
                className="min-h-[150px] w-full resize-none border-none focus-visible:ring-0 p-4 text-base bg-muted/5 rounded-lg"
                autoFocus
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>{remainingCharacters} characters left</span>
                {attachmentLabel ? <span>{attachmentLabel}</span> : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <UploadButton
                  endpoint="commentAttachment"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={(error: Error) => {
                    toast.error(error.message || "Upload failed");
                  }}
                  disabled={attachments.length >= MAX_ATTACHMENTS}
                  appearance={{
                    button: cn(
                      "h-9 px-4 py-2 w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center gap-2 ut-uploading:cursor-not-allowed ut-uploading:opacity-50",
                      isSubmitting && "pointer-events-none opacity-50"
                    ),
                    allowedContent: "hidden",
                    container: "w-auto",
                  }}
                  content={{
                    button({ isUploading }) {
                      if (isUploading) return (
                        <div className="flex flex-col items-center gap-1">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      );
                      return <><Paperclip className="h-5 w-5 mb-1" /><span>Add File</span></>;
                    }
                  }}
                />
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(false);
                      setMessage("");
                      setAttachments([]);
                      setIsExpanded(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddComment();
                    }}
                    disabled={isSubmitting || !message.trim()}
                  >
                    {isSubmitting ? tStories("creating") : tStories("save")}
                  </Button>
                </div>
              </div>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {attachments.map((attachment, index) => {
                    const isImage = attachment.type === 'image' || attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    return (
                      <div
                        key={`${attachment.url}-${index}`}
                        className={cn(
                          "relative rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm group transition-all hover:border-primary/50 hover:shadow-sm",
                          isImage ? "w-24 overflow-hidden" : "flex items-center gap-3 px-3 py-2 text-xs min-w-[140px]"
                        )}
                      >
                        {isImage ? (
                          <div className="aspect-square w-full rounded-lg overflow-hidden bg-muted/20">
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <p className="text-[10px] text-white font-medium truncate px-2">{attachment.name}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              {getFileIcon(attachment.name, attachment.type)}
                            </div>
                            <div className="flex flex-col min-w-0 pr-4">
                              <span className="font-semibold text-foreground truncate">{attachment.name}</span>
                              {attachment.size && (
                                <span className="text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</span>
                              )}
                            </div>
                          </>
                        )}
                        <button
                          type="button"
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noComments")}</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-4 p-4 rounded-lg border border-border/60 bg-background shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] transition-all hover:shadow-md hover:border-border/80"
            >
              <Avatar className="h-9 w-9 border border-border/40">
                <AvatarImage src={comment.user.image || undefined} />
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                  {comment.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    {comment.user.name}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {format(new Date(comment.createdAt), "MMM d, p")}
                  </span>
                </div>
                <div className="text-sm text-foreground/80 leading-relaxed max-w-none">
                  <p className="whitespace-pre-line break-words">{comment.content}</p>
                </div>
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-6 space-y-3 pt-4 border-t border-border/40">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-2">
                      <Paperclip className="h-3 w-3" />
                      Attachments ({comment.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {comment.attachments.map((attachment, index) => {
                        const isImage = attachment.type === 'image' || attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                        return (
                          <div key={`${attachment.url}-${index}`} className="group relative">
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "flex items-center gap-3 rounded-xl border border-border/60 bg-muted/10 p-2 text-xs font-medium transition-all hover:bg-muted/30 hover:border-primary/30 hover:shadow-sm cursor-pointer",
                                isImage ? "flex-col items-start gap-2 p-1.5 w-44" : "pr-4 min-w-[200px]"
                              )}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedAttachment(attachment);
                              }}
                            >
                              {isImage ? (
                                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-background shadow-inner">
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                    <ExternalLink className="h-3 w-3 text-foreground" />
                                  </div>
                                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9px] text-white">
                                    Attachment {index + 1}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10 relative">
                                  {getFileIcon(attachment.name, attachment.type)}
                                  <div className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-bold">
                                    {index + 1}
                                  </div>
                                </div>
                              )}
                              <div className={cn("flex flex-col min-w-0 flex-1", isImage && "w-full px-1.5 pb-1")}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate text-foreground/90 group-hover:text-primary transition-colors font-semibold">
                                    {attachment.name}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-normal">
                                  <span>{attachment.size ? formatFileSize(attachment.size) : 'File'}</span>
                                  {isImage && <span>Attachment {index + 1}</span>}
                                </div>
                              </div>
                              {!isImage && (
                                <div className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity">
                                  <Download className="h-3 w-3" />
                                </div>
                              )}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

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
    </div>
  );
}
