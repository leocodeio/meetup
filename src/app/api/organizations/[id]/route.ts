import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/services/auth/db.server";
import { prisma, Prisma } from "@/server/services/auth/db.server";
import { updateOrganizationSchema } from "@/lib/validations/organization";
import { ApiResponse, UpdateOrganizationInput } from "@/types/organization";

/**
 * GET /api/organizations/[id]
 * Fetch a specific organization by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (organization.ownerId !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const memberCount = await prisma.organizationMember.count({
      where: { orgId: id },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { ...organization, memberCount },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]
 * Update an organization
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify ownership
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    if (organization.ownerId !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validationResult = updateOrganizationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Validation failed",
          message: validationResult.error.issues[0]?.message,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data as UpdateOrganizationInput;

    // If slug is being updated, check if it's unique
    if (data.slug && data.slug !== organization.slug) {
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: data.slug },
      });

      if (existingOrg) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Slug already exists" },
          { status: 409 }
        );
      }
    }

    // Build update data (only include provided fields)
    const updateData: Prisma.OrganizationUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image !== undefined) updateData.image = data.image || null;

    // Update organization
    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: updateData,
    });

    const memberCount = await prisma.organizationMember.count({
      where: { orgId: id },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { ...updatedOrg, memberCount },
        message: "Organization updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating organization:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * Delete an organization (owner only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify ownership
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    if (organization.ownerId !== session.user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete organization and all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // First delete all organization members
      await tx.organizationMember.deleteMany({
        where: { orgId: id },
      });

      // Then delete all projects and their members
      const projects = await tx.project.findMany({
        where: { orgId: id },
        select: { id: true },
      });

      for (const project of projects) {
        // Delete project members
        await tx.projectMember.deleteMany({
          where: { projectId: project.id },
        });
      }

      // Delete all projects
      await tx.project.deleteMany({
        where: { orgId: id },
      });

      // Finally delete the organization
      await tx.organization.delete({
        where: { id },
      });
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Organization deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
