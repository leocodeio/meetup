"use client";

import { useState } from "react";
import { Organization } from "@/types/organization";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DeleteOrganizationDialogProps {
  organization: Organization;
  onSuccess?: () => void;
}

/**
 * Dialog for deleting an organization (owner only)
 * Shows a confirmation dialog before deleting
 */
export function DeleteOrganizationDialog({
  organization,
  onSuccess,
}: DeleteOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to delete organization");
        return;
      }

      toast.success("Organization deleted successfully!");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const firstLetter = organization.name.charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Organization</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete this organization?
            This action cannot be undone and will permanently delete the organization
            and all associated data.
          </DialogDescription>
        </DialogHeader>

        {/* Organization Preview */}
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          {organization.image ? (
            <Avatar className="h-12 w-12">
              <AvatarImage src={organization.image} alt={organization.name} />
              <AvatarFallback>{firstLetter}</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg font-semibold">
                {firstLetter}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1">
            <p className="font-semibold">{organization.name}</p>
            <p className="text-sm text-muted-foreground">@{organization.slug}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
