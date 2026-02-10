"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Video, Plus, Clock, Calendar, Play, FileText, Download, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';

interface Meeting {
  id: string;
  title: string;
  meetingUrl: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  _count: {
    recordings: number;
    transcripts: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [recordAudio, setRecordAudio] = useState(true);
  const [recordVideo, setRecordVideo] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async () => {
    if (!title || !meetingUrl) return;
    
    setCreating(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          meetingUrl,
          recordAudio,
          recordVideo,
          autoTranscribe: true
        })
      });

      if (res.ok) {
        setShowCreateDialog(false);
        setTitle('');
        setMeetingUrl('');
        fetchMeetings();
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteMeeting = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    
    try {
      await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      fetchMeetings();
    } catch (error) {
      console.error('Failed to delete meeting:', error);
    }
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header page="Dashboard" />
      
      <main className="container px-4 py-8 mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Meetings</h1>
            <p className="text-muted-foreground">Manage your recorded meetings and transcriptions</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="mt-4 md:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                New Meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Meeting Recording</DialogTitle>
                <DialogDescription>
                  Enter the Google Meet URL to start recording automatically.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    placeholder="Team Standup"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="url">Google Meet URL</Label>
                  <Input
                    id="url"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={recordAudio}
                      onChange={(e) => setRecordAudio(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Record Audio</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={recordVideo}
                      onChange={(e) => setRecordVideo(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Record Video</span>
                  </label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createMeeting} disabled={creating || !title || !meetingUrl}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Start Recording
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Meetings Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : meetings.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No meetings yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your first meeting recording by clicking the button above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">{meeting.title}</CardTitle>
                      <CardDescription className="line-clamp-1 mt-1">
                        {meeting.meetingUrl}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadge(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {meeting._count.recordings} recordings
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {meeting._count.transcripts} transcripts
                      </div>
                    </div>
                    
                    {/* Dates */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Created: {formatDate(meeting.createdAt)}
                    </div>
                    
                    {meeting.startTime && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Started: {formatDate(meeting.startTime)}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/dashboard/${meeting.id}`}>
                          <Play className="w-3 h-3 mr-1" />
                          View
                        </a>
                      </Button>
                      
                      {meeting._count.recordings > 0 && (
                        <Button variant="outline" size="sm">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="ml-auto text-destructive hover:text-destructive"
                        onClick={() => deleteMeeting(meeting.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
