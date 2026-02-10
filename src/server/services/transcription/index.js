/**
 * Transcription Service
 * 
 * Handles AI-powered transcription of meeting recordings
 * using Mistral API (Whisper) for speech-to-text
 */

const Mistral = require('@mistralai/mistralai');
const fs = require('fs');
const path = require('path');

// Initialize Mistral client
const mistralClient = new Mistral.Client(process.env.MISTRAL_API_KEY);

/**
 * Transcribe a meeting recording
 * 
 * @param {string} meetingId - The meeting ID
 * @param {string} audioPath - Path to the audio/video file
 * @returns {Promise<object>} - Transcript data
 */
async function transcribeMeeting(meetingId, audioPath) {
  console.log(`[Transcription] Starting transcription for meeting ${meetingId}`);
  console.log(`[Transcription] Audio file: ${audioPath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    // Read the audio file
    const audioBuffer = fs.readFileSync(audioPath);
    const base64Audio = audioBuffer.toString('base64');

    // Transcribe using Mistral API (Whisper)
    console.log(`[Transcription] Sending to Mistral API...`);
    
    const response = await mistralClient.audio.transcriptions.create({
      model: 'whisper-large',
      audio: base64Audio,
      language: 'en', // TODO: Auto-detect language
      responseFormat: 'verbose_json',
    });

    // Parse the response
    const transcriptData = {
      meetingId,
      content: response.text,
      segments: response.segments || [],
      language: response.language || 'en',
      duration: response.duration || 0,
      model: 'mistral-whisper',
      confidence: calculateAverageConfidence(response.segments || [])
    };

    console.log(`[Transcription] Transcription complete`);
    console.log(`[Transcription] Duration: ${transcriptData.duration}s`);
    console.log(`[Transcription] Segments: ${transcriptData.segments.length}`);

    return transcriptData;

  } catch (error) {
    console.error(`[Transcription] Error:`, error);
    throw error;
  }
}

/**
 * Calculate average confidence from segments
 */
function calculateAverageConfidence(segments) {
  if (!segments || segments.length === 0) return 0;
  
  const totalConfidence = segments.reduce((sum, seg) => {
    return sum + (seg.avg_logprob || seg.confidence || 0.9);
  }, 0);
  
  return totalConfidence / segments.length;
}

/**
 * Format transcript for database storage
 * 
 * @param {object} transcriptData - Raw transcript from API
 * @param {boolean} includeSpeakers - Whether to include speaker labels
 * @returns {object} - Formatted transcript
 */
function formatTranscript(transcriptData, includeSpeakers = false) {
  const { segments, content, language, duration } = transcriptData;
  
  // Extract speaker information if available
  const speakers = [];
  
  if (includeSpeakers && segments.length > 0) {
    // Group segments by speaker if diarization info is available
    // Note: Whisper doesn't provide speaker diarization by default
    // This is a placeholder for when we implement diarization
    let currentSpeaker = null;
    
    segments.forEach((segment, index) => {
      if (segment.speaker && segment.speaker !== currentSpeaker) {
        currentSpeaker = segment.speaker;
        speakers.push({
          id: `speaker-${speakers.length + 1}`,
          name: currentSpeaker || `Speaker ${speakers.length + 1}`,
          timestamps: []
        });
      }
      
      if (speakers.length > 0) {
        speakers[speakers.length - 1].timestamps.push({
          start: segment.start,
          end: segment.end,
          text: segment.text
        });
      }
    });
  }

  // Create structured transcript with timestamps
  const formattedSegments = segments.map((seg, index) => ({
    id: `segment-${index}`,
    start: seg.start,
    end: seg.end,
    text: seg.text.trim(),
    speaker: seg.speaker || null,
    confidence: seg.avg_logprob || null
  }));

  return {
    content,
    speakers: speakers.length > 0 ? speakers : null,
    language,
    duration,
    segments: formattedSegments,
    wordCount: content.split(/\s+/).length,
    createdAt: new Date()
  };
}

/**
 * Generate SRT format from transcript
 * 
 * @param {object} transcriptData - Formatted transcript
 * @returns {string} - SRT formatted string
 */
function generateSRT(transcriptData) {
  const { segments } = transcriptData;
  
  let srt = '';
  
  segments.forEach((segment, index) => {
    const startTime = formatTimeForSRT(segment.start);
    const endTime = formatTimeForSRT(segment.end);
    
    srt += `${index + 1}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    if (segment.speaker) {
      srt += `[${segment.speaker}] `;
    }
    srt += `${segment.text}\n\n`;
  });
  
  return srt;
}

/**
 * Generate VTT format from transcript
 * 
 * @param {object} transcriptData - Formatted transcript
 * @returns {string} - VTT formatted string
 */
function generateVTT(transcriptData) {
  const { segments } = transcriptData;
  
  let vtt = 'WEBVTT\n\n';
  
  segments.forEach((segment, index) => {
    const startTime = formatTimeForVTT(segment.start);
    const endTime = formatTimeForVTT(segment.end);
    
    vtt += `${index + 1}\n`;
    vtt += `${startTime} --> ${endTime}\n`;
    if (segment.speaker) {
      vtt += `<v ${segment.speaker}>${segment.text}</v>\n\n`;
    } else {
      vtt += `${segment.text}\n\n`;
    }
  });
  
  return vtt;
}

/**
 * Format seconds to SRT time format (HH:MM:SS,mmm)
 */
function formatTimeForSRT(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
}

/**
 * Format seconds to VTT time format (HH:MM:SS.mmm)
 */
function formatTimeForVTT(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(ms, 3)}`;
}

function pad(num, size = 2) {
  return num.toString().padStart(size, '0');
}

/**
 * Save transcript to files
 * 
 * @param {string} meetingId - Meeting ID
 * @param {object} transcriptData - Formatted transcript
 * @param {string} outputDir - Output directory
 */
function saveTranscriptFiles(meetingId, transcriptData, outputDir) {
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Save JSON
  const jsonPath = path.join(outputDir, `${meetingId}-transcript.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(transcriptData, null, 2));
  console.log(`[Transcription] Saved JSON to ${jsonPath}`);
  
  // Save SRT
  const srtContent = generateSRT(transcriptData);
  const srtPath = path.join(outputDir, `${meetingId}-transcript.srt`);
  fs.writeFileSync(srtPath, srtContent);
  console.log(`[Transcription] Saved SRT to ${srtPath}`);
  
  // Save VTT
  const vttContent = generateVTT(transcriptData);
  const vttPath = path.join(outputDir, `${meetingId}-transcript.vtt`);
  fs.writeFileSync(vttPath, vttContent);
  console.log(`[Transcription] Saved VTT to ${vttPath}`);
  
  return {
    json: jsonPath,
    srt: srtPath,
    vtt: vttPath
  };
}

/**
 * Full transcription pipeline
 * 
 * @param {string} meetingId - Meeting ID
 * @param {string} audioPath - Path to audio file
 * @param {string} outputDir - Output directory for transcript files
 * @returns {Promise<object>} - Saved transcript data
 */
async function transcribeAndSave(meetingId, audioPath, outputDir) {
  // Step 1: Transcribe
  const rawTranscript = await transcribeMeeting(meetingId, audioPath);
  
  // Step 2: Format
  const formattedTranscript = formatTranscript(rawTranscript);
  
  // Step 3: Save to files
  const files = saveTranscriptFiles(meetingId, formattedTranscript, outputDir);
  
  return {
    ...formattedTranscript,
    files
  };
}

// Export all functions
module.exports = {
  transcribeMeeting,
  formatTranscript,
  generateSRT,
  generateVTT,
  saveTranscriptFiles,
  transcribeAndSave
};
