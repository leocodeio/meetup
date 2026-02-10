"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { StoryWithAssignees } from "@/types/story";

interface DeleteStoryDialogProps {
  story: StoryWithAssignees;
  projectId: string;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  trigger?: React.ReactNode;
}

export function DeleteStoryDialog({
  story,
  projectId,
  onSuccess,
  onOpenChange,
  isOpen,
  trigger,
}: DeleteStoryDialogProps) {
  const t = useTranslations("Dashboard.stories");
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories/${story.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success(t("deleteSuccess"));
        handleOpenChange(false);
        onSuccess?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t("deleteError"));
      }
    } catch (error) {
      console.error("Failed to delete story:", error);
      toast.error(t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {trigger === undefined ? (
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
      ) : (
        trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDescription")}
            <br />
            <br />
            <strong>{story.title}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
