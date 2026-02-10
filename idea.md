# Meeting Bot - AI-Powered Google Meet Recording & Transcription

## Overview

Build a full-stack Next.js application that automatically joins Google Meet sessions, records meetings (audio + video), performs speech diarization, transcribes using AI, and uploads everything to cloud storage via UploadThing.

Reference: https://docs.recall.ai/

## Core Features

### 1. Meeting Bot Joiner
- **Bot joins automatically** using provided meeting URL and credentials
- Acts as a participant so it can record audio and video
- Supports Google authentication (OAuth) for seamless meet access
- Handles multiple concurrent meetings

### 2. Audio & Video Recording
- Capture both audio and video streams of the meeting
- Save raw recordings to temporary storage before upload
- Support for different quality settings (720p, 1080p)
- Automatic file naming and organization by meeting date/time

### 3. Speech Diarization
- Automatically identify and tag each speaker in the recording
- Assign timestamps and speaker labels in the transcript
- Speaker recognition using voice fingerprints
- Handle overlapping speech detection

### 4. Transcription
- Convert meeting audio (with diarization) into text using AI providers
- **Primary Provider**: Mistral AI (configured)
- **Alternative Provider**: Gemini (optional)
- Output structured transcripts with speaker labels and timestamps
- Support for multiple languages

### 5. Cloud Upload (UploadThing)
- Upload all recorded files and transcripts to storage via UploadThing
- Includes: video files, audio files, and diarized text transcripts
- Organized folder structure in cloud storage
- Generate shareable links for recordings

### 6. Download & Access Interface (Optional MVP UI)
- Simple interface to access downloads:
  - Audio/video recording
  - Diarized transcript
- Web interface for managing recordings
- Searchable transcript viewer
- Export options (PDF, SRT, VTT)

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Better Auth (Google OAuth)
- **State Management**: React Hooks + Context

### Backend
- **API**: Next.js Route Handlers
- **Database**: MongoDB with Prisma ORM
- **AI/ML**: Mistral API for transcription
- **Storage**: UploadThing (S3-compatible)

### Infrastructure
- **Runtime**: Bun.js
- **Meeting Bot**: Puppeteer/Playwright for browser automation
- **Recording**: MediaRecorder API + ffmpeg
- **Deployment**: Vercel (frontend) + Railway/Render (bot service)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐   │
│  │   Landing   │  │   Dashboard │  │  Recordings  │   │
│  │    Page      │  │    Page      │  │     Page      │   │
│  └─────────────┘  └─────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   Auth      │  │   Meetings   │  │  Recordings API   │   │
│  │   (Google)  │  │   Manager    │  │                 │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│   Bot Service       │               │     MongoDB          │
│  (Puppeteer)       │               │    (Recordings,     │
│  - Joins Meet     │               │     Transcripts)    │
│  - Records Audio   │               └─────────────────────┘
│  - Records Video   │
└─────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Processing                             │
│  ┌─────────────────┐  ┌─────────────────────────────┐    │
│  │  Speech         │  │      Transcription          │    │
│  │  Diarization    │  │      (Mistral AI)           │    │
│  └─────────────────┘  └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Storage                             │
│                 UploadThing (S3-compatible)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   Videos     │  │    Audio    │  │    Transcripts   │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Google OAuth sign-in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Meetings
- `POST /api/meetings` - Schedule a new meeting bot
- `GET /api/meetings` - List all meetings
- `GET /api/meetings/:id` - Get meeting details
- `DELETE /api/meetings/:id` - Delete meeting

### Recordings
- `GET /api/recordings/:meetingId` - List recordings for a meeting
- `GET /api/recordings/:id/download` - Download recording
- `GET /api/transcripts/:meetingId` - Get transcript

### Upload
- `POST /api/uploadthing` - UploadThing configuration

## Environment Variables

```env
# Database
DATABASE_URL=mongodb://127.0.0.1:27017/meetup

# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_GOOGLE_ID=your-google-client-id
BETTER_AUTH_GOOGLE_SECRET=your-google-client-secret
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# AI Transcription
AI_PROVIDER=mistral
AI_MODEL=ministral-3b-2512
MISTRAL_API_KEY=your-mistral-api-key

# Storage
UPLOADTHING_TOKEN=your-uploadthing-token

# Google Meet Bot
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

## Getting Started

### Prerequisites
- Bun.js installed
- MongoDB running locally or Atlas connection
- Google Cloud Console project with Meet API enabled
- Mistral API key
- UploadThing account

### Installation

```bash
# Clone the repository
git clone https://github.com/leocodeio/meetup.git
cd meetup

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
bun run dev
```

### Bot Service Setup

```bash
# Install puppeteer for bot
bun add puppeteer

# Run bot service (separate terminal)
node bot-service/index.js
```

## Development Roadmap

### Phase 1: Core Infrastructure
- [ ] Set up Next.js project with all dependencies
- [ ] Configure MongoDB with Prisma schema
- [ ] Implement Google OAuth authentication
- [ ] Create basic landing page

### Phase 2: Bot Implementation
- [ ] Build Google Meet joiner using Puppeteer
- [ ] Implement audio/video recording
- [ ] Handle meeting disconnection/reconnection
- [ ] Support multiple concurrent meetings

### Phase 3: AI Transcription
- [ ] Integrate Mistral AI for transcription
- [ ] Implement speech diarization
- [ ] Generate timestamped transcripts
- [ ] Support speaker identification

### Phase 4: Storage & UI
- [ ] Configure UploadThing integration
- [ ] Build recording management dashboard
- [ ] Create download/access interface
- [ ] Add search functionality for transcripts

## License

MIT
