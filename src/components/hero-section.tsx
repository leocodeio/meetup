"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ArrowRight, Video, Mic, Cloud, Brain } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  const t = useTranslations("Hero");

  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24 lg:pt-28">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[600px] sm:max-w-[700px] md:max-w-[800px] max-h-[600px] sm:max-h-[700px] md:max-h-[800px] bg-blue-500/20 rounded-full blur-[120px] -z-10 animate-pulse" />

      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          {/* Trust Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            <span className="text-xs sm:text-sm font-medium">AI-Powered Meeting Bot</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight px-4">
            <span className="text-foreground">Never Miss a</span>
            <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 italic font-serif">
              Meeting Again
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            AI-powered bot joins your Google Meet, records everything, transcribes with speaker labels, and uploads to cloud storage automatically.
          </p>

          {/* Feature Tags */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 px-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm">
              <Mic className="w-3 h-3 mr-1.5" /> Audio Recording
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs sm:text-sm">
              <Video className="w-3 h-3 mr-1.5" /> Video Capture
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs sm:text-sm">
              <Brain className="w-3 h-3 mr-1.5" /> Smart Transcription
            </span>
            <span className="inline-flex items-center px-3 py--green-500/1 rounded-full bg10 text-green-600 text-xs sm:text-sm">
              <Cloud className="w-3 h-3 mr-1.5" /> Cloud Upload
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4">
            <Button size="lg" className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold transition-all hover:scale-105" asChild>
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold transition-all hover:bg-blue-500/5" asChild>
              <Link
                rel="noreferrer noopener"
                href="https://github.com/leocodeio/meetup"
                target="_blank"
              >
                View on GitHub
                <SiGithub className="ml-2 w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              </Link>
            </Button>
          </div>

          {/* Mockup */}
          <div className="relative mt-12 sm:mt-14 md:mt-16 w-full max-w-5xl animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative rounded-lg sm:rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden shadow-2xl">
              <Image
                src="/images/hero-mockup.png"
                alt="Meetup Dashboard Mockup - AI Meeting Bot"
                width={1200}
                height={675}
                className="w-full h-auto object-cover transform transition duration-500 hover:scale-[1.02]"
                priority
              />
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 hidden md:block p-3 sm:p-4 bg-background/80 backdrop-blur border rounded-lg sm:rounded-xl shadow-xl animate-bounce-slow">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500" />
                <span className="text-xs sm:text-sm font-medium">Recording Active</span>
              </div>
            </div>
            <div className="absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 hidden md:block p-3 sm:p-4 bg-background/80 backdrop-blur border rounded-lg sm:rounded-xl shadow-xl animate-bounce-slow" style={{ animationDelay: '1s' }}>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-blue-500" />
                <span className="text-xs sm:text-sm font-medium">Transcription Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
