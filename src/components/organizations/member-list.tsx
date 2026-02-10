"use client";

import { useState } from "react";
import { OrganizationMemberWithUser } from "@/types/organization";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Shield, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface MemberListProps {
  members: OrganizationMemberWithUser[];
  orgId: string;
  currentUserId: string;
  isOwner: boolean;
  onUpdate?: () => void;
}

/**
 * Component to display and manage organization members
 */
export function MemberList({
  members,
  orgId,
  currentUserId,
  isOwner,
  onUpdate,
}: MemberListProps) {
  const t = useTranslations("Dashboard.members");
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<OrganizationMemberWithUser | null>(null);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdatingMemberId(memberId);

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update member");
      }

      toast.success(t("updateSuccess"));
      onUpdate?.();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error(error instanceof Error ? error.message : t("updateError"));
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    setDeletingMemberId(memberToDelete.id);

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/members/${memberToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to remove member");
      }

      toast.success(t("removeSuccess"));
      setMemberToDelete(null);
      onUpdate?.();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error(error instanceof Error ? error.message : t("removeError"));
    } finally {
      setDeletingMemberId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return <Badge variant="default">{t("statuses.ACCEPTED")}</Badge>;
      case "PENDING":
        return <Badge variant="secondary">{t("statuses.PENDING")}</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">{t("statuses.REJECTED")}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    return role === "ADMIN" ? (
      <Shield className="h-4 w-4" />
    ) : (
      <User className="h-4 w-4" />
    );
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const canEdit = isOwner && !isCurrentUser;

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={member.user.image || undefined}
                          alt={member.user.name}
                        />
                        <AvatarFallback>
                          {member.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canEdit && member.status === "ACCEPTED" ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member.id, value)
                        }
                        disabled={updatingMemberId === member.id}
                      >
                        <SelectTrigger className="w-32">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(member.role)}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">
                            {t("roles.MEMBER")}
                          </SelectItem>
                          <SelectItem value="ADMIN">
                            {t("roles.ADMIN")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <span>{t(`roles.${member.role}`)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToDelete(member)}
                        disabled={deletingMemberId === member.id}
                      >
                        {deletingMemberId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!memberToDelete}
        onOpenChange={(open) => !open && setMemberToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
