import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { SprintBoardClient } from "@/components/stories/sprint-board-client";
import { getSession, prisma } from "@/server/services/auth/db.server";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
    sprintId: string;
  }>;
}

export default async function SprintDetailPage({ params }: PageProps) {
  const { locale, id: projectId, sprintId } = await params;
  const headersList = await headers();
  const session = await getSession({ headers: headersList } as NextRequest);

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login`);
  }

  // Fetch sprint with project and stories
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      project: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              ownerId: true,
            },
          },
          members: {
            where: { userId: session.user.id },
          },
        },
      },
      stories: {
        orderBy: { position: "asc" },
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Fetch organization membership to get the role
  const orgMember = sprint ? await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: {
        orgId: sprint.project.organization.id,
        userId: session.user.id,
      },
    },
  }) : null;

  if (!sprint) {
    notFound();
  }

  if (sprint.projectId !== projectId) {
    notFound();
  }

  // Check if user has access to this project
  const isOrgOwner = sprint.project.organization.ownerId === session.user.id;
  const isProjectMember = sprint.project.members.length > 0;

  const userRole = orgMember?.role;

  const user = {
    name: session.user.name || "User",
    email: session.user.email,
    image: session.user.image || undefined,
  };

  if (!isOrgOwner && !isProjectMember) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col">
          <Header page="Sprints" user={user} />
          <main className="flex-1 px-3 sm:px-4 py-6 sm:py-8 md:py-12">
            <div className="max-w-7xl mx-auto">
              <BreadcrumbNavigation userId={session.user.id} />
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                  <p className="text-muted-foreground">
                    You do not have permission to view this sprint.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Header page="Sprints" user={user} />
        <main className="flex-1 px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <BreadcrumbNavigation userId={session.user.id} />
            <SprintBoardClient
              sprintId={sprintId}
              projectId={projectId}
              sprintName={sprint.name}
              sprintGoal={sprint.goal}
              sprintStatus={sprint.status}
              sprintStartDate={sprint.startDate}
              sprintEndDate={sprint.endDate}
              initialStories={sprint.stories}
              userRole={userRole}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
