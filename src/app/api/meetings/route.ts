import { NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db/prisma';
import { z } from 'zod';

// Validation schema for creating a meeting
const createMeetingSchema = z.object({
  title: z.string().min(1).max(255),
  meetingUrl: z.string().url().includes('meet.google.com'),
  recordAudio: z.boolean().default(true),
  recordVideo: z.boolean().default(true),
  autoTranscribe: z.boolean().default(true),
  scheduledTime: z.string().datetime().optional()
});

/**
 * GET /api/meetings
 * List all meetings for the current user
 */
export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filter
    const where = {
      userId: session.user.id
    };

    if (status) {
      where.status = status;
    }

    // Fetch meetings with recordings count
    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        _count: {
          select: {
            recordings: true,
            transcripts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count
    const total = await prisma.meeting.count({ where });

    return NextResponse.json({
      meetings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + meetings.length < total
      }
    });

  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meetings
 * Create a new meeting
 */
export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = createMeetingSchema.parse(body);

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        title: validatedData.title,
        meetingUrl: validatedData.meetingUrl,
        recordAudio: validatedData.recordAudio,
        recordVideo: validatedData.recordVideo,
        autoTranscribe: validatedData.autoTranscribe,
        status: validatedData.scheduledTime ? 'SCHEDULED' : 'PENDING',
        startTime: validatedData.scheduledTime ? new Date(validatedData.scheduledTime) : null,
        userId: session.user.id
      }
    });

    // TODO: In production, schedule the bot to start at scheduledTime
    // For now, immediately trigger bot for immediate meetings
    if (!validatedData.scheduledTime) {
      // Trigger bot (in production, this would be a background job)
      await triggerBot(meeting.id);
    }

    return NextResponse.json(meeting, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}

/**
 * Trigger the bot to start a meeting
 */
async function triggerBot(meetingId) {
  try {
    // In production, this would be a message to a job queue
    // For development, we'll spawn a child process
    const { spawn } = require('child_process');
    
    const botProcess = spawn('node', [
      path.join(process.cwd(), 'bot-service', 'index.js'),
      meetingId
    ], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    botProcess.stdout.on('data', (data) => {
      console.log(`[Bot-${meetingId}] ${data}`);
    });

    botProcess.stderr.on('data', (data) => {
      console.error(`[Bot-${meetingId}] Error: ${data}`);
    });

    botProcess.on('close', (code) => {
      console.log(`[Bot-${meetingId}] Process exited with code ${code}`);
    });

    console.log(`[API] Started bot process for meeting ${meetingId}`);

  } catch (error) {
    console.error('Failed to trigger bot:', error);
    // Update meeting status to failed
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'FAILED' }
    });
  }
}

// Import path for bot triggering
const path = require('path');
