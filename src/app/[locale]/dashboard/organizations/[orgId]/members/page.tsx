"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { getSession } from "@/server/services/auth/auth-client";
import { InviteMemberDialog, MemberList } from "@/components/organizations";
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { OrganizationMemberWithUser } from "@/types/organization";

interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
}

export default function MembersPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId as string;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMemberWithUser[]>([]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession();
        if (session?.data?.user) {
          setUserId(session.data.user.id);
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Failed to get session:", error);
        router.push("/auth/login");
      }
    };

    fetchSession();
  }, [router]);

  const fetchOrganization = useCallback(async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.data);
      } else {
        toast.error("Failed to load organization");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      toast.error("Failed to load organization");
      router.push("/dashboard");
    }
  }, [orgId, router]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/organizations/${orgId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || []);
      } else {
        toast.error("Failed to load members");
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (userId) {
      fetchOrganization();
      fetchMembers();
    }
  }, [userId, fetchOrganization, fetchMembers]);

  if (loading || !organization || !userId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = organization.ownerId === userId;

  return (
    <div className="container mx-auto py-8 px-4">
      <BreadcrumbNavigation userId={userId} />
      
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
            <h1 className="text-3xl font-bold">{organization.name}</h1>
            <p className="text-muted-foreground mt-1">
              Manage organization members and invitations
            </p>
          </div>
          {isOwner && (
            <InviteMemberDialog orgId={orgId} onSuccess={fetchMembers} />
          )}
        </div>

        <MemberList
          members={members}
          orgId={orgId}
          currentUserId={userId}
          isOwner={isOwner}
          onUpdate={fetchMembers}
        />
      </div>
    </div>
  );
}

