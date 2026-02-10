# Implementation Plan: Meeting Bot End-to-End

## 📋 Implementation Order

### Phase 1: Database Schema
- [ ] 1.1 Update Prisma schema for meetings, recordings, transcripts
- [ ] 1.2 Push schema to MongoDB

### Phase 2: Bot Service (Core)
- [ ] 2.1 Create bot service structure
- [ ] 2.2 Implement Google Meet joiner (Puppeteer)
- [ ] 2.3 Add audio recording capability
- [ ] 2.4 Add video recording capability
- [ ] 2.5 Handle meeting lifecycle (join, record, end)

### Phase 3: AI Transcription Pipeline
- [ ] 3.1 Create transcription service (Mistral API)
- [ ] 3.2 Implement speech diarization
- [ ] 3.3 Generate timestamped transcripts
- [ ] 3.4 Save transcripts to database

### Phase 4: Storage Integration
- [ ] 4.1 Configure UploadThing
- [ ] 4.2 Create upload service for recordings
- [ ] 4.3 Create upload service for transcripts

### Phase 5: API Endpoints
- [ ] 5.1 POST /api/meetings - Create meeting
- [ ] 5.2 GET /api/meetings - List meetings
- [ ] 5.3 GET /api/meetings/:id - Get meeting details
- [ ] 5.4 GET /api/recordings - List recordings
- [ ] 5.5 GET /api/transcripts/:meetingId - Get transcript

### Phase 6: Dashboard UI
- [ ] 6.1 Dashboard page to list meetings
- [ ] 6.2 Create meeting form (URL input)
- [ ] 6.3 Recording detail view
- [ ] 6.4 Transcript viewer with timestamps
- [ ] 6.5 Download links

## 🎯 Current Focus

Starting with **Phase 1: Database Schema Update**

### New Schema Models

```
Meeting
- id, title, meetingUrl, status, startTime, endTime
- userId (owner), createdAt, updatedAt

Recording
- id, meetingId, fileName, fileType (audio/video)
- fileSize, duration, uploadStatus
- cloudUrl (UploadThing), localPath
- createdAt

Transcript
- id, meetingId, content (text)
- speakers (JSON: [{id, name, timestamps}])
- language, duration
- createdAt
```

## 🚀 Execution

Using OpenCode Kimi K2.5 for all coding tasks as per agents/AGENTS.md guidelines.
