"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { getSession } from "@/server/services/auth/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Check, X, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";

interface Invitation {
  id: string;
  role: string;
  status: string;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
  };
}

export default function InvitationsPage() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingToId, setRespondingToId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession();
        if (!session?.data?.user) {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Failed to get session:", error);
        router.push("/auth/login");
      }
    };

    fetchSession();
  }, [router]);

  const fetchInvitations = async (manual = false) => {
    if (manual) setLoading(true);
    else setLoading(true); // actually it's already true on mount

    // Optimized: only set loading if manual, otherwise keep it for initial
    if (manual) setLoading(true);
    else setLoading(true);

    // Let's just use a dedicated refreshing state for manual if we want, but setLoading is fine here.
    setLoading(true);
    try {
      const response = await fetch("/api/user/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.data || []);
      } else {
        toast.error("Failed to load invitations");
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

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
          ? "Invitation accepted! You are now a member of the organization."
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
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading invitations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Organization Invitations</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchInvitations(true)}
                disabled={loading}
                className="h-9 w-9"
                title="Refresh invitations"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <p className="text-muted-foreground mt-2">
              Accept or decline invitations to join organizations
            </p>
          </div>
          {invitations.length > 0 && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {invitations.length} pending
            </Badge>
          )}
        </div>

        {invitations.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pending invitations</h3>
              <p className="text-muted-foreground">
                When someone invites you to join their organization, you&apos;ll see it here.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 mt-1">
                    <AvatarImage
                      src={invitation.organization.image || undefined}
                      alt={invitation.organization.name}
                    />
                    <AvatarFallback className="text-xl">
                      {invitation.organization.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">
                          {invitation.organization.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          @{invitation.organization.slug}
                        </p>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        {invitation.role}
                      </Badge>
                    </div>

                    {invitation.organization.description && (
                      <p className="text-muted-foreground mb-4">
                        {invitation.organization.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      <Button
                        size="default"
                        onClick={() =>
                          handleInvitationResponse(
                            invitation.id,
                            invitation.organization.id,
                            "ACCEPTED"
                          )
                        }
                        disabled={respondingToId === invitation.id}
                        className="gap-2"
                      >
                        {respondingToId === invitation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Accept Invitation
                      </Button>
                      <Button
                        size="default"
                        variant="outline"
                        onClick={() =>
                          handleInvitationResponse(
                            invitation.id,
                            invitation.organization.id,
                            "REJECTED"
                          )
                        }
                        disabled={respondingToId === invitation.id}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
