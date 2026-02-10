import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db/prisma';

/**
 * GET /api/transcripts/:meetingId
 * Get all transcripts for a meeting
 */
export async function GET(request, { params }) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = await params;

    // Check meeting exists and ownership
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        transcripts: true,
        recordings: true
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (meeting.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return transcripts with formatted data
    const transcripts = meeting.transcripts.map(t => ({
      id: t.id,
      language: t.language,
      duration: t.duration,
      model: t.model,
      confidence: t.confidence,
      format: t.format,
      createdAt: t.createdAt,
      wordCount: t.content.split(/\s+/).length,
      // Return first 500 characters as preview
      preview: t.content.substring(0, 500) + (t.content.length > 500 ? '...' : '')
    }));

    return NextResponse.json({
      meetingId,
      meetingTitle: meeting.title,
      totalTranscripts: transcripts.length,
      transcripts
    });

  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcripts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transcripts/:meetingId
 * Create a new transcript for a meeting (called by bot service)
 */
export async function POST(request, { params }) {
  try {
    // Note: In production, this should be called by the bot service with API key auth
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { meetingId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Check meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (meeting.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create transcript
    const transcript = await prisma.transcript.create({
      data: {
        meetingId,
        content: body.content,
        speakers: body.speakers || null,
        language: body.language || 'en',
        duration: body.duration || null,
        model: body.model || null,
        confidence: body.confidence || null,
        cloudUrl: body.cloudUrl || null,
        format: body.format || 'json'
      }
    });

    // Update meeting status if this is the first transcript
    const transcriptCount = await prisma.transcript.count({ where: { meetingId } });
    if (transcriptCount === 1) {
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'COMPLETED' }
      });
    }

    return NextResponse.json(transcript, { status: 201 });

  } catch (error) {
    console.error('Error creating transcript:', error);
    return NextResponse.json(
      { error: 'Failed to create transcript' },
      { status: 500 }
    );
  }
}
