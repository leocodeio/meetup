import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db/prisma';
import { z } from 'zod';

const updateMeetingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['PENDING', 'SCHEDULED', 'JOINING', 'RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional()
});

/**
 * GET /api/meetings/:id
 * Get a single meeting with all recordings and transcripts
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        recordings: true,
        transcripts: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check ownership
    if (meeting.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(meeting);

  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/meetings/:id
 * Update a meeting
 */
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateMeetingSchema.parse(body);

    // Check meeting exists and ownership
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id }
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (existingMeeting.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update meeting
    const meeting = await prisma.meeting.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json(meeting);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meetings/:id
 * Delete a meeting and all associated recordings/transcripts
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check meeting exists and ownership
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id }
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (existingMeeting.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete meeting (cascade will delete recordings and transcripts)
    await prisma.meeting.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    );
  }
}
