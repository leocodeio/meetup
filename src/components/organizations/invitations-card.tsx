"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Check, X, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  role: string;
  status: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
  };
}

interface InvitationsCardProps {
  userId: string;
}

/**
 * Component to display pending organization invitations
 */
export function InvitationsCard({ userId }: InvitationsCardProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingToId, setRespondingToId] = useState<string | null>(null);

  const fetchInvitations = async (manual = false) => {
    if (manual) setLoading(true);
    try {
      const response = await fetch("/api/user/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchInvitations();
    }
  }, [userId]);

  const handleInvitationResponse = async (
    memberId: string,
    orgId: string,
    status: "ACCEPTED" | "REJECTED"
  ) => {
    setRespondingToId(memberId);

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to respond to invitation");
      }

      toast.success(
        status === "ACCEPTED"
          ? "Invitation accepted!"
          : "Invitation rejected"
      );

      // Refresh invitations
      fetchInvitations();
    } catch (error) {
      console.error("Error responding to invitation:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to respond"
      );
    } finally {
      setRespondingToId(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Organization Invitations</h3>
        </div>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show the card if there are no invitations
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Organization Invitations</h3>
          <Badge variant="secondary">{invitations.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchInvitations(true)}
          disabled={loading}
          className="h-8 w-8 text-muted-foreground"
          title="Refresh invitations"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={invitation.organization.image || undefined}
                alt={invitation.organization.name}
              />
              <AvatarFallback>
                {invitation.organization.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {invitation.organization.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Role: {invitation.role}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="default"
                onClick={() =>
                  handleInvitationResponse(
                    invitation.id,
                    invitation.organization.id,
                    "ACCEPTED"
                  )
                }
                disabled={respondingToId === invitation.id}
              >
                {respondingToId === invitation.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleInvitationResponse(
                    invitation.id,
                    invitation.organization.id,
                    "REJECTED"
                  )
                }
                disabled={respondingToId === invitation.id}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
