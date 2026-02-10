"use client";

import { useState } from "react";
import { CreateOrganizationInput } from "@/types/organization";
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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateOrganizationDialogProps {
  onSuccess?: () => void;
}

/**
 * Dialog for creating a new organization
 */
export function CreateOrganizationDialog({ onSuccess }: CreateOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrganizationInput>({
    name: "",
    slug: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to create organization");
        return;
      }

      toast.success("Organization created successfully!");
      setFormData({ name: "", slug: "" });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setFormData((prev) => {
      const newSlug = !prev.slug
        ? value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
        : prev.slug;
      return { ...prev, name: value, slug: newSlug };
    });
  };

  const firstLetter = formData.name?.charAt(0).toUpperCase() || "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to manage projects and collaborate with your team.
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
                {firstLetter || "?"}
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
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              placeholder="Acme Corporation"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
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
            <Label htmlFor="image">Logo URL (Optional)</Label>
            <Input
              id="image"
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
              Create Organization
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
