"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AddProjectMemberDialogProps {
  projectId: string;
  onSuccess?: () => void;
}

interface AvailableMember {
  id: string;
  name: string;
  email: string;
  image?: string;
}

/**
 * Dialog for adding organization members to a project
 */
export function AddProjectMemberDialog({
  projectId,
  onSuccess,
}: AddProjectMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>(
    []
  );
  const [formData, setFormData] = useState({
    userId: "",
    role: "MEMBER" as "ADMIN" | "MEMBER" | "VIEWER",
  });

  const fetchAvailableMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/members?mode=available`
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch available members");
      }

      setAvailableMembers(result.data || []);
    } catch (error) {
      console.error("Error fetching available members:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load members"
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Fetch available organization members when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableMembers();
    }
  }, [open, fetchAvailableMembers]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add member to project");
      }

      toast.success("Member added to project successfully");
      setFormData({ userId: "", role: "MEMBER" });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error adding member to project:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add member"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Add Members">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Member to Project</DialogTitle>
          <DialogDescription>
            Add organization members to this project. Only organization members
            can be added.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : availableMembers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No available organization members to add. All members are
                  already part of this project or there are no accepted members
                  in the organization.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="userId">Select Member</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, userId: value })
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="userId">
                      <SelectValue placeholder="Choose a member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={member.image} />
                              <AvatarFallback>
                                {(member.name || member.email).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {member.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {member.email}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        role: value as "ADMIN" | "MEMBER" | "VIEWER",
                      })
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Viewer: Read-only access • Member: Can edit • Admin: Full
                    control
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isLoading ||
                !formData.userId ||
                availableMembers.length === 0
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
