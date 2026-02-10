"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/theme-toggle";
import { ColorSelector } from "@/components/theme/color-selector";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations("Navigation");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: t("features"), href: "#features" },
    // { name: t("pricing"), href: "#pricing" },
    // { name: t("testimonials"), href: "#testimonials" },
    // { name: t("faq"), href: "#faq" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-header)] w-full transition-all duration-300",
        scrolled
          ? "border-b bg-background/80 backdrop-blur-md py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="h-10 w-10 relative transition-transform group-hover:scale-110">
              <Image
                src="/favicon.ico"
                alt="GitSprint Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-bold text-2xl tracking-tight hidden sm:inline">
              GitSprint
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              {item.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2 pr-4 border-r">
            <ColorSelector />
            <ModeToggle />
            <LocaleSwitcher />
          </div>
          <Button variant="ghost" asChild className="hover:bg-primary/5">
            <Link href="/auth/login">{t("signIn")}</Link>
          </Button>
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/auth/signup">{t("getStarted")}</Link>
          </Button>
        </div>

        <div className="md:hidden flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="rounded-xl"
          >
            <div className="relative w-6 h-6">
              <Menu
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  mobileMenuOpen ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"
                )}
              />
              <X
                className={cn(
                  "absolute inset-0 transition-all duration-300",
                  mobileMenuOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"
                )}
              />
            </div>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-b transition-all duration-300 ease-in-out px-4 overflow-hidden",
          mobileMenuOpen ? "max-h-[500px] py-8 opacity-100" : "max-h-0 py-0 opacity-0"
        )}
      >
        <div className="space-y-6">
          <div className="space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4 pt-6 border-t">
            <ColorSelector />
            <ModeToggle />
            <LocaleSwitcher />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                {t("signIn")}
              </Link>
            </Button>
            <Button className="w-full" asChild>
              <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                {t("getStarted")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
