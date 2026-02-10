import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { getSession, prisma } from "@/server/services/auth/db.server";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
    slug: string;
  }>;
}

export default async function StoryPage({ params }: PageProps) {
  const { locale, id: projectId, slug } = await params;
  const headersList = await headers();
  const session = await getSession({ headers: headersList } as NextRequest);

  if (!session?.user?.id) {
    redirect(`/${locale}/auth/login`);
  }

  // Fetch story by projectId and slug (compound unique constraint)
  const story = await prisma.story.findUnique({
    where: {
      projectId_slug: {
        projectId,
        slug,
      },
    },
    include: {
      project: {
        include: {
          organization: {
            select: { id: true, name: true, slug: true, ownerId: true },
          },
          members: { where: { userId: session.user.id } },
        },
      },
      sprint: { select: { id: true, name: true, status: true } },
      assignees: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
    },
  });

  if (!story) {
    notFound();
  }

  // Redirect to dashboard with story context
  // The dashboard will handle opening the story and loading the correct workspace
  const dashboardUrl = `/${locale}/dashboard?story=${slug}&project=${story.projectId}&org=${story.project.organization.id}`;
  redirect(dashboardUrl);
}
