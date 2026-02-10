"use client";

import { useState, useEffect, use } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, AudioLines, FileText, Clock, Calendar, Download, Play, ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import Link from '@/i18n/navigation';

interface Recording {
  id: string;
  fileType: string;
  fileName: string;
  fileSize: number | null;
  duration: number | null;
  uploadStatus: string;
  cloudUrl: string | null;
  createdAt: string;
}

interface Transcript {
  id: string;
  language: string;
  duration: number | null;
  confidence: number | null;
  format: string;
  content: string;
  speakers: any;
  createdAt: string;
}

interface MeetingDetail {
  id: string;
  title: string;
  meetingUrl: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
  recordings: Recording[];
  transcripts: Transcript[];
}

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recordings');

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      const res = await fetch(`/api/meetings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
      }
    } catch (error) {
      console.error('Failed to fetch meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
      PENDING: 'secondary',
      SCHEDULED: 'secondary',
      JOINING: 'default',
      RECORDING: 'default',
      PROCESSING: 'secondary',
      COMPLETED: 'success',
      FAILED: 'destructive',
      CANCELLED: 'outline'
    };
    return variants[status] || 'secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Meeting not found</h2>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header page={meeting.title} />
      
      <main className="container px-4 py-8 mx-auto">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Meeting Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{meeting.title}</CardTitle>
                  <Badge variant={getStatusBadge(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {meeting.meetingUrl}
                  </a>
                </CardDescription>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Started</p>
                  <p className="font-medium">{formatDate(meeting.startTime)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="font-medium">{formatDuration(meeting.duration)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Video className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Recordings</p>
                  <p className="font-medium">{meeting.recordings.length}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Transcripts</p>
                  <p className="font-medium">{meeting.transcripts.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Recordings and Transcripts */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="recordings" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Recordings ({meeting.recordings.length})
            </TabsTrigger>
            <TabsTrigger value="transcripts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Transcripts ({meeting.transcripts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recordings">
            {meeting.recordings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
                  <p className="text-muted-foreground">
                    Recordings will appear here once the meeting is complete.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {meeting.recordings.map((recording) => (
                  <Card key={recording.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {recording.fileType === 'VIDEO' ? (
                            <Video className="w-5 h-5 text-blue-500" />
                          ) : (
                            <AudioLines className="w-5 h-5 text-green-500" />
                          )}
                          <CardTitle className="text-base">{recording.fileName}</CardTitle>
                        </div>
                        <Badge variant={recording.uploadStatus === 'COMPLETED' ? 'success' : 'secondary'}>
                          {recording.uploadStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration</span>
                          <span>{formatDuration(recording.duration)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size</span>
                          <span>{formatFileSize(recording.fileSize)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created</span>
                          <span>{formatDate(recording.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Play className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        {recording.cloudUrl && (
                          <Button size="sm" variant="outline" className="flex-1">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transcripts">
            {meeting.transcripts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No transcripts yet</h3>
                  <p className="text-muted-foreground">
                    Transcripts will appear here once transcription is complete.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {meeting.transcripts.map((transcript) => (
                  <Card key={transcript.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Transcript</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{transcript.language}</Badge>
                          {transcript.confidence && (
                            <Badge variant="secondary">
                              {Math.round(transcript.confidence * 100)}% confidence
                            </Badge>
                          )}
                          <Badge variant="outline">{transcript.format.toUpperCase()}</Badge>
                        </div>
                      </div>
                      <CardDescription>
                        Duration: {formatDuration(transcript.duration)} • 
                        Created: {formatDate(transcript.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Transcript Preview */}
                      <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-4">
                          {transcript.speakers && Array.isArray(transcript.speakers) && transcript.speakers.length > 0 ? (
                            // Show with speaker labels
                            (transcript.speakers as any[]).map((speaker: any) => (
                              <div key={speaker.id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="default" className="text-xs">
                                    {speaker.name}
                                  </Badge>
                                </div>
                                <p className="text-sm pl-4">
                                  {speaker.timestamps?.map((ts: any) => ts.text).join(' ')}
                                </p>
                              </div>
                            ))
                          ) : (
                            // Show plain text
                            <p className="text-sm whitespace-pre-wrap">{transcript.content}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Download JSON
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Download SRT
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Download VTT
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
