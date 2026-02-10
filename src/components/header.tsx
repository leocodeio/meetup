"use client";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { User, Settings, LogOut } from "lucide-react";
import Image from "next/image";
import { ModeToggle } from "@/components/theme/theme-toggle";
import { ColorSelector } from "@/components/theme/color-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBetterAuthSignout } from "@/server/services/auth/auth-client";
import { Link } from "@/i18n/navigation";

interface HeaderProps {
  page?: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

export function Header({ user, page }: HeaderProps) {
  const signout = useBetterAuthSignout();

  return (
    <header className="sticky top-0 z-[var(--z-header)] w-full border-b bg-gradient-to-r from-background via-background to-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex h-14 sm:h-16 items-center justify-between pl-16 pr-4 sm:px-4 md:px-6">
        {/* Left Section - Empty on large screens (sidebar handles branding) */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg border border-primary/30 bg-muted flex items-center justify-center">
              <Image
                src="/favicon.ico"
                alt="Meetup Logo"
                width={36}
                height={36}
                className="h-7 w-7 sm:h-9 sm:w-9 rounded-md"
              />
            </div>
            <span className="font-bold text-xs sm:text-sm truncate">Meetup</span>
          </Link>
          <div className="hidden md:block">
            <h1 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">Meetup</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="italic font-medium text-foreground/80">{page}</span>
            </h1>
          </div>
        </div>

        {/* Right Section - Theme, Language, and User */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <ModeToggle />

          {/* Color Selector */}
          <ColorSelector />

          {/* Language Switcher */}
          <LocaleSwitcher />

          {/* Divider */}
          <div className="h-6 w-px bg-border hidden md:block mx-1" />

          {/* User Profile Section */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 group cursor-pointer">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-110">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-300">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground group-hover:text-primary/70 transition-colors duration-300">
                      {user.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signout}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
