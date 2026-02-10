"use client";

import { Badge } from "@/components/ui/badge";
import {
  Video,
  Mic,
  Brain,
  Cloud,
  Clock,
  Users,
  Lock,
  Download,
  Globe,
  Zap
} from "lucide-react";
import { useTranslations } from "next-intl";

const features = [
  {
    icon: Video,
    title: "Auto-Join Meetings",
    description: "Bot automatically joins Google Meet sessions using your credentials. Never miss an important meeting again.",
    badge: "Automated",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500"
  },
  {
    icon: Mic,
    title: "Crystal-Clear Recording",
    description: "Capture high-quality audio and video of every meeting. All streams recorded locally before upload.",
    badge: "HD Quality",
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500"
  },
  {
    icon: Brain,
    title: "Smart Transcription",
    description: "AI-powered transcription with speaker diarization. Know exactly who said what and when.",
    badge: "AI-Powered",
    color: "from-orange-500/20 to-yellow-500/20",
    iconColor: "text-orange-500"
  },
  {
    icon: Cloud,
    title: "Cloud Upload",
    description: "Automatically upload recordings and transcripts to UploadThing. Access your files from anywhere.",
    badge: "Auto-Sync",
    color: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-500"
  },
  {
    icon: Clock,
    title: "Timestamp Navigation",
    description: "Navigate transcripts with precision. Jump directly to any moment in your recordings.",
    badge: "Smart Search",
    color: "from-indigo-500/20 to-blue-500/20",
    iconColor: "text-indigo-500"
  },
  {
    icon: Users,
    title: "Speaker Identification",
    description: "Automatically identify and label different speakers. Perfect for multi-person meetings.",
    badge: "Diarization",
    color: "from-red-500/20 to-orange-500/20",
    iconColor: "text-red-500"
  }
];

export function FeaturesSection() {
  const t = useTranslations("Features");

  return (
    <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 md:mb-20">
          <Badge variant="outline" className="px-3 sm:px-4 py-1 sm:py-1.5 mb-4 sm:mb-6 border-blue-500/20 bg-blue-500/5 text-blue-600 text-xs sm:text-sm">
            Core Features
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6 px-4">
            Everything you need for <span className="text-blue-600 font-serif italic font-medium">智能会议</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed px-4">
            Powerful AI-powered features to automate your meeting recordings and transcriptions.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="group relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border bg-card hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 hover:-translate-y-2">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-background border flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${feature.iconColor}`} />
                  </div>
                  <Badge variant="secondary" className="bg-muted/50 text-xs font-semibold">
                    {feature.badge}
                  </Badge>
                </div>

                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Highlight Section */}
        <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-24">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border bg-card p-6 sm:p-8 md:p-10 lg:p-16">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent -z-10" />

            <div className="grid gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge className="mb-4 sm:mb-6 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 text-xs sm:text-sm">
                  How It Works
                </Badge>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
                  Three Simple Steps to <span className="text-blue-600 font-serif italic">Automated Meetings</span>
                </h3>
                <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 md:mb-10 leading-relaxed">
                  Set it up once and let the AI handle everything. Join, record, transcribe, and upload automatically.
                </p>

                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <span className="text-xs font-bold">1</span>
                    </div>
                    <span className="font-medium text-sm sm:text-base">Paste Meeting URL</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <span className="font-medium text-sm sm:text-base">Bot Joins & Records</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <span className="font-medium text-sm sm:text-base">Access Transcripts</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <Download className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base">Download & Share</span>
                  </div>
                </div>
              </div>

              <div className="relative group mt-6 lg:mt-0">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative rounded-2xl sm:rounded-3xl border bg-background/50 backdrop-blur-sm p-6 sm:p-8 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
                  <div className="flex flex-col items-center space-y-4 scale-75 sm:scale-90 md:scale-100">
                    <div className="flex space-x-3">
                      <div className="h-10 w-20 sm:h-12 sm:w-24 rounded-lg bg-blue-500/20 animate-pulse" />
                      <div className="h-10 w-20 sm:h-12 sm:w-24 rounded-lg bg-purple-500/20 animate-pulse delay-75" />
                      <div className="h-10 w-20 sm:h-12 sm:w-24 rounded-lg bg-pink-500/20 animate-pulse delay-150" />
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                      <Mic className="h-5 w-5 text-red-500 animate-pulse" />
                      <span>Recording in progress...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
