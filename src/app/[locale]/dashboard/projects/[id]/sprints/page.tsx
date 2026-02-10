import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { SprintList } from "@/components/sprints";
import { getSession, prisma } from "@/server/services/auth/db.server";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function ProjectSprintsPage({ params }: PageProps) {
  const { locale, id: projectId } = await params;
  const headersList = await headers();
  const session = await getSession({ headers: headersList } as NextRequest);

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login`);
  }

  // Fetch project with organization details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
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
  });

  // Fetch organization membership to get the role
  const orgMember = project ? await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: {
        orgId: project.organization.id,
        userId: session.user.id,
      },
    },
  }) : null;

  if (!project) {
    notFound();
  }

  // Check if user has access to this project
  const isOrgOwner = project.organization.ownerId === session.user.id;
  const isProjectMember = project.members.length > 0;

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
          <main className="flex-1 px-4 py-8 md:py-12">
            <div className="max-w-7xl mx-auto">
              <BreadcrumbNavigation userId={session.user.id} />
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                  <p className="text-muted-foreground">
                    You do not have permission to view this project.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Determine user's role in the organization
  const userRole = orgMember?.role;

  // Fetch sprints with stats
  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: {
          stories: true,
        },
      },
      stories: {
        select: {
          status: true,
        },
      },
    },
  });

  // Calculate stats for each sprint
  const sprintsWithStats = sprints.map((sprint) => {
    const todoCount = sprint.stories.filter((s) => s.status === "TODO").length;
    const inProgressCount = sprint.stories.filter(
      (s) => s.status === "IN_PROGRESS"
    ).length;
    const doneCount = sprint.stories.filter((s) => s.status === "DONE").length;

    return {
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      projectId: sprint.projectId,
      createdAt: sprint.createdAt,
      updatedAt: sprint.updatedAt,
      storyCount: sprint._count.stories,
      todoCount,
      inProgressCount,
      doneCount,
    };
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Header page="Sprints" user={user} />
        <main className="flex-1 px-4 py-8 md:py-12">
          <div className="max-w-7xl mx-auto space-y-6">
            <BreadcrumbNavigation userId={session.user.id} />

            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sprints</h1>
              <p className="text-muted-foreground mt-1">
                Manage sprints for {project.name}
              </p>
            </div>

            <SprintList
              initialSprints={sprintsWithStats}
              projectId={projectId}
              projectName={project.name}
              userRole={userRole}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
