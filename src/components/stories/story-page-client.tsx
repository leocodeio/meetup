"use client";

import { useRouter } from "next/navigation";
import { EditStoryDialog } from "./edit-story-dialog";
import type { StoryWithAssignees } from "@/types/story";
import type { OrganizationMemberRole } from "@prisma/client";

interface StoryPageClientProps {
  story: StoryWithAssignees;
  projectId: string;
  returnUrl: string;
  userRole?: OrganizationMemberRole;
}

export function StoryPageClient({
  story,
  projectId,
  returnUrl,
  userRole,
}: StoryPageClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    // Refresh the page to get updated data
    router.refresh();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Navigate back to sprint board when dialog closes
      router.push(returnUrl);
    }
  };

  return (
    <EditStoryDialog
      story={story}
      projectId={projectId}
      onSuccess={handleSuccess}
      onOpenChange={handleOpenChange}
      isOpen={true}
      mode="page"
      returnUrl={returnUrl}
      userRole={userRole}
    />
  );
}
