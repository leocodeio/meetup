"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  const t = useTranslations("Hero");

  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24 lg:pt-32">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[600px] sm:max-w-[700px] md:max-w-[800px] max-h-[600px] sm:max-h-[700px] md:max-h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />

      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          {/* Trust Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary animate-in fade-in slide-in-from-top-4 duration-1000">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
            <span className="text-xs sm:text-sm font-medium">{t("badge")}</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight px-4">
            <span className="text-foreground">GitSprint</span>
            <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 italic font-serif">
              {t("title")}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
            {t("subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4">
            <Button size="lg" className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold transition-all hover:scale-105" asChild>
              <Link href="/auth/signup">
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold transition-all hover:bg-primary/5" asChild>
              <Link
                rel="noreferrer noopener"
                href="https://github.com/leocodeio/gitsprint-opensource"
                target="_blank"
              >
                Repo
                <SiGithub className="ml-2 w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              </Link>
            </Button>
          </div>

          {/* Mockup */}
          <div className="relative mt-12 sm:mt-14 md:mt-16 w-full max-w-5xl animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative rounded-lg sm:rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden shadow-2xl">
              <Image
                src="/images/hero-mockup.png"
                alt="GitSprint Dashboard Mockup"
                width={1200}
                height={675}
                className="w-full h-auto object-cover transform transition duration-500 hover:scale-[1.02]"
                priority
              />
            </div>

            {/* Floating Elements/Badges */}
            <div className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 hidden md:block p-3 sm:p-4 bg-background/80 backdrop-blur border rounded-lg sm:rounded-xl shadow-xl animate-bounce-slow">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-indigo-500" />
                <span className="text-xs sm:text-sm font-medium">Reimagining Agile</span>
              </div>
            </div>
            <div className="absolute -bottom-4 sm:-bottom-6 -left-4 sm:-left-6 hidden md:block p-3 sm:p-4 bg-background/80 backdrop-blur border rounded-lg sm:rounded-xl shadow-xl animate-bounce-slow" style={{ animationDelay: '1s' }}>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-pink-500" />
                <span className="text-xs sm:text-sm font-medium">Early Access Beta</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
