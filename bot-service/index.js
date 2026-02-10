/**
 * Google Meet Bot Service
 * 
 * This service automatically joins Google Meet sessions, records meetings,
 * and saves the recordings for later transcription.
 * 
 * Prerequisites:
 * - Install dependencies: bun add puppeteer
 * - Ensure MongoDB replica set is running
 * - Configure environment variables
 * 
 * Usage:
 *   node bot-service/index.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const prisma = require('../src/server/db/prisma');

// Configuration
const CONFIG = {
  // Recording settings
  CHUNK_SIZE: 1024 * 1024 * 10, // 10MB chunks
  RECORDING_DIR: './recordings',
  
  // Browser settings
  HEADLESS: process.env.BOT_HEADLESS !== 'false',
  WIDTH: 1920,
  HEIGHT: 1080,
  
  // Meeting settings
  JOIN_TIMEOUT: 60000, // 60 seconds to join
  CHECK_INTERVAL: 5000, // Check every 5 seconds
};

/**
 * Main Bot Class for Google Meet Recording
 */
class MeetBot {
  constructor(meetingId) {
    this.meetingId = meetingId;
    this.browser = null;
    this.page = null;
    this.mediaRecorder = null;
    this.chunks = [];
    this.isRecording = false;
    this.recordingPath = null;
    this.meetingInfo = null;
  }

  /**
   * Initialize and start the bot
   */
  async start() {
    try {
      console.log(`[Bot-${this.meetingId}] Starting bot...`);
      
      // Load meeting info from database
      this.meetingInfo = await prisma.meeting.findUnique({
        where: { id: this.meetingId },
        include: { user: true }
      });

      if (!this.meetingInfo) {
        throw new Error(`Meeting ${this.meetingId} not found`);
      }

      console.log(`[Bot-${this.meetingId}] Meeting: ${this.meetingInfo.title}`);
      console.log(`[Bot-${this.meetingId}] URL: ${this.meetingInfo.meetingUrl}`);

      // Update status to JOINING
      await prisma.meeting.update({
        where: { id: this.meetingId },
        data: { status: 'JOINING' }
      });

      // Create recording directory
      this.recordingPath = path.join(
        CONFIG.RECORDING_DIR,
        this.meetingId,
        new Date().toISOString().replace(/:/g, '-')
      );
      fs.mkdirSync(this.recordingPath, { recursive: true });

      // Launch browser
      await this.launchBrowser();

      // Join the meeting
      await this.joinMeeting();

      // Start recording if enabled
      if (this.meetingInfo.recordAudio || this.meetingInfo.recordVideo) {
        await this.startRecording();
      }

      // Wait for meeting to end
      await this.waitForMeetingEnd();

    } catch (error) {
      console.error(`[Bot-${this.meetingId}] Error:`, error);
      await this.handleError(error);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Launch Puppeteer browser
   */
  async launchBrowser() {
    console.log(`[Bot-${this.meetingId}] Launching browser...`);
    
    this.browser = await puppeteer.launch({
      headless: CONFIG.HEADLESS,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--allow-file-access-from-files',
        '--enable-web-bluetooth',
        '--disable-web-security',
        '--autoplay-policy=no-user-gesture-required',
        `--window-size=${CONFIG.WIDTH},${CONFIG.HEIGHT}`
      ]
    });

    const context = this.browser.defaultBrowserContext();
    await context.overridePermissions(this.meetingInfo.meetingUrl, [
      'microphone',
      'camera',
      'notifications'
    ]);

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: CONFIG.WIDTH, height: CONFIG.HEIGHT });
    
    // Enable console logging from page
    this.page.on('console', msg => {
      console.log(`[Page] ${msg.text()}`);
    });

    this.page.on('pageerror', error => {
      console.error(`[Page Error] ${error.message}`);
    });

    console.log(`[Bot-${this.meetingId}] Browser launched`);
  }

  /**
   * Join the Google Meet session
   */
  async joinMeeting() {
    console.log(`[Bot-${this.meetingId}] Joining meeting...`);
    
    await this.page.goto(this.meetingInfo.meetingUrl, {
      waitUntil: 'networkidle2',
      timeout: CONFIG.JOIN_TIMEOUT
    });

    // Wait for the meeting page to load
    await this.page.waitForSelector('body', { timeout: 30000 });

    // Click "Join Now" or "Join" button if present
    try {
      const joinButton = await this.page.$('button[aria-label*="Join"]');
      if (joinButton) {
        await joinButton.click();
        console.log(`[Bot-${this.meetingId}] Clicked join button`);
      }
    } catch (e) {
      console.log(`[Bot-${this.meetingId}] No join button found, may auto-join`);
    }

    // Wait to enter the meeting
    await this.page.waitForTimeout(10000);

    // Check if we're in the meeting
    const inMeeting = await this.page.evaluate(() => {
      return document.querySelector('[data-meeting-title]') !== null ||
             document.querySelector('[aria-label*="Meeting info"]') !== null ||
             document.querySelector('[class*="video-grid"]') !== null;
    });

    if (inMeeting) {
      console.log(`[Bot-${this.meetingId}] Successfully joined meeting`);
      await prisma.meeting.update({
        where: { id: this.meetingId },
        data: { 
          status: 'RECORDING',
          startTime: new Date()
        }
      });
    } else {
      throw new Error('Failed to join meeting');
    }
  }

  /**
   * Start recording audio and/or video
   */
  async startRecording() {
    console.log(`[Bot-${this.meetingId}] Starting recording...`);
    
    // Get media stream from the page
    const stream = await this.page.evaluate(async (recordAudio, recordVideo) => {
      try {
        // Try to get display media first (screen recording)
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: recordVideo ? { cursor: 'always' } : false,
          audio: recordAudio
        });

        return displayStream.id;
      } catch (displayError) {
        console.error('Display media failed:', displayError);
        
        // Fallback: get user media
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: recordVideo,
          audio: recordAudio
        });

        return userStream.id;
      }
    }, this.meetingInfo.recordAudio, this.meetingInfo.recordVideo);

    // Start MediaRecorder
    this.page.evaluate(async (streamId, chunkSize) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      
      window.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      window.chunks = [];
      
      window.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          window.chunks.push(e.data);
        }
      };
      
      window.mediaRecorder.start(chunkSize);
    }, stream, CONFIG.CHUNK_SIZE);

    this.isRecording = true;
    console.log(`[Bot-${this.meetingId}] Recording started`);
  }

  /**
   * Stop recording and save to file
   */
  async stopRecording() {
    if (!this.isRecording) return;

    console.log(`[Bot-${this.meetingId}] Stopping recording...`);

    // Stop the media recorder
    await this.page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.mediaRecorder && window.mediaRecorder.state !== 'inactive') {
          window.mediaRecorder.onstop = () => resolve();
          window.mediaRecorder.stop();
        } else {
          resolve();
        }
      });
    });

    // Get recorded data
    const recordedData = await this.page.evaluate(() => {
      return {
        chunks: window.chunks,
        blob: new Blob(window.chunks, { type: 'video/webm' })
      };
    });

    // Save to file
    const videoPath = path.join(this.recordingPath, 'meeting.webm');
    const videoBuffer = Buffer.from(await recordedData.blob.arrayBuffer());
    fs.writeFileSync(videoPath, videoBuffer);

    console.log(`[Bot-${this.meetingId}] Recording saved to ${videoPath}`);
    console.log(`[Bot-${this.meetingId}] File size: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Create recording entry in database
    await prisma.recording.create({
      data: {
        meetingId: this.meetingId,
        fileType: 'VIDEO',
        fileName: 'meeting.webm',
        fileSize: videoBuffer.length,
        localPath: videoPath,
        uploadStatus: 'PENDING',
        duration: Math.floor((Date.now() - this.meetingInfo.startTime.getTime()) / 1000)
      }
    });

    this.isRecording = false;
  }

  /**
   * Wait for meeting to end
   */
  async waitForMeetingEnd() {
    console.log(`[Bot-${this.meetingId}] Waiting for meeting to end...`);
    
    const checkInterval = setInterval(async () => {
      try {
        // Check if meeting is still active
        const isActive = await this.page.evaluate(() => {
          // Check for leave button or meeting ended indicator
          const leaveButton = document.querySelector('[aria-label*="Leave"]');
          const endedIndicator = document.querySelector('[class*="meeting-ended"]');
          
          return leaveButton !== null && endedIndicator === null;
        });

        if (!isActive) {
          clearInterval(checkInterval);
          await this.endMeeting();
        }
      } catch (error) {
        console.error(`[Bot-${this.meetingId}] Check error:`, error.message);
      }
    }, CONFIG.CHECK_INTERVAL);
  }

  /**
   * End the meeting and save results
   */
  async endMeeting() {
    console.log(`[Bot-${this.meetingId}] Meeting ended`);
    
    await prisma.meeting.update({
      where: { id: this.meetingId },
      data: { 
        status: 'PROCESSING',
        endTime: new Date()
      }
    });

    // Stop recording
    await this.stopRecording();

    // Update status to COMPLETED
    await prisma.meeting.update({
      where: { id: this.meetingId },
      data: { status: 'COMPLETED' }
    });

    console.log(`[Bot-${this.meetingId}] Meeting processing complete`);
  }

  /**
   * Handle errors
   */
  async handleError(error) {
    console.error(`[Bot-${this.meetingId}] Error handling:`, error);
    
    await prisma.meeting.update({
      where: { id: this.meetingId },
      data: { 
        status: 'FAILED',
        endTime: new Date()
      }
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log(`[Bot-${this.meetingId}] Cleaning up...`);
    
    if (this.isRecording) {
      await this.stopRecording();
    }

    if (this.browser) {
      await this.browser.close();
      console.log(`[Bot-${this.meetingId}] Browser closed`);
    }
  }
}

/**
 * Start a meeting bot
 */
async function startBot(meetingId) {
  const bot = new MeetBot(meetingId);
  await bot.start();
}

/**
 * Start all pending meetings
 */
async function startAllPendingBots() {
  const pendingMeetings = await prisma.meeting.findMany({
    where: {
      status: {
        in: ['PENDING', 'SCHEDULED']
      }
    }
  });

  console.log(`Found ${pendingMeetings.length} pending meetings`);

  for (const meeting of pendingMeetings) {
    // In production, you'd want to spawn these in separate processes
    await startBot(meeting.id);
  }
}

// Export for use in other modules
module.exports = { MeetBot, startBot, startAllPendingBots };

// Run if called directly
if (require.main === module) {
  const meetingId = process.argv[2];
  
  if (!meetingId) {
    console.log('Usage: node bot-service/index.js <meetingId>');
    console.log('Or run all pending: node bot-service/index.js --all');
    process.exit(1);
  }

  if (meetingId === '--all') {
    startAllPendingBots().catch(console.error);
  } else {
    startBot(meetingId).catch(console.error);
  }
}
