"use client";

import { useState } from "react";
import { Organization, UpdateOrganizationInput } from "@/types/organization";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditOrganizationDialogProps {
  organization: Organization;
  onSuccess?: () => void;
}

/**
 * Dialog for editing an organization
 */
export function EditOrganizationDialog({
  organization,
  onSuccess,
}: EditOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateOrganizationInput>({
    name: organization.name,
    slug: organization.slug,
    description: organization.description || "",
    image: organization.image || "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to update organization");
        return;
      }

      toast.success("Organization updated successfully!");
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const firstLetter = formData.name?.charAt(0).toUpperCase() || "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update your organization details. Only you can edit this organization.
          </DialogDescription>
        </DialogHeader>

        {/* Logo Preview */}
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          {formData.image ? (
            <Avatar className="h-16 w-16">
              <AvatarImage src={formData.image} alt={formData.name} />
              <AvatarFallback>{firstLetter}</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl font-semibold">
                {firstLetter}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">Logo Preview</p>
            <p className="text-xs text-muted-foreground">
              {formData.image ? "Custom logo" : "Default avatar (first letter)"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Organization Name *</Label>
            <Input
              id="edit-name"
              placeholder="Acme Corporation"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-slug">Slug *</Label>
            <Input
              id="edit-slug"
              placeholder="acme-corporation"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              disabled={isLoading}
              required
              title="URL-friendly name (lowercase, hyphens only)"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL-friendly name (lowercase, hyphens only)
            </p>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Describe your organization..."
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit-image">Logo URL (Optional)</Label>
            <Input
              id="edit-image"
              placeholder="https://example.com/logo.png"
              type="url"
              value={formData.image || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, image: e.target.value }))
              }
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use first letter as avatar
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
