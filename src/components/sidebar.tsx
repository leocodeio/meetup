"use client";

import { useState, useEffect } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBetterAuthSignout } from "@/server/services/auth/auth-client";
import Image from "next/image";

import { LucideIcon } from "lucide-react";

interface SidebarProps {
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  submenu?: { label: string; href: string }[];
}

export function Sidebar({ user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true); // Default to collapsed on desktop
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [invitationCount, setInvitationCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pathname = usePathname();
  const signout = useBetterAuthSignout();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Fetch invitation count
  const fetchInvitationCount = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const response = await fetch("/api/user/invitations");
      if (response.ok) {
        const data = await response.json();
        setInvitationCount(data.data?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      if (manual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvitationCount();
    }
  }, [user]);

  const stripLocale = (p: string) => p.replace(/^\/(en|es|fr)(?=\/|$)/, "");
  const currentPath = stripLocale(pathname) || "/";
  const isActive = (href: string) => {
    // Exact match
    if (currentPath === href) return true;

    // For Dashboard, only match exact path to avoid matching /dashboard/manage
    if (href === "/dashboard") return false;

    // For other paths, check if current path starts with href
    return currentPath.startsWith(`${href}/`);
  };

  const menuItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Manage", href: "/dashboard/manage", icon: Settings },
    {
      label: "Invitations",
      href: "/dashboard/organizations/invites",
      icon: Mail,
      badge: invitationCount > 0 ? invitationCount : undefined,
    },
    { label: "Profile", href: "/profile", icon: User },
  ];

  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <>
      <style>{`
        @keyframes fadeInOverlay {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.5;
          }
        }

        .overlay-fade-in {
          animation: fadeInOverlay 0.3s ease-out forwards;
        }
      `}</style>

      {/* Mobile Hamburger Toggle - Outside Sidebar */}
      <div className="fixed top-3 left-3 z-[calc(var(--z-sidebar)+10)] md:hidden">
        <Button
          variant="default"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Close sidebar" : "Open sidebar"}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          className="h-10 w-10 shadow-lg border-2 border-primary/20"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar Container - Hidden on mobile unless open */}
      <div
        className={`fixed md:fixed left-0 top-0 h-screen transition-all duration-300 z-[var(--z-sidebar)] ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } ${sidebarWidth}`}
      >
        {/* Sidebar Content */}
        <aside
          className="w-full h-full bg-background border-r flex flex-col"
          aria-hidden={!isOpen}
        >
          {/* Separator with Collapse Button */}
          <div className="border-b px-3 py-3 flex items-center justify-between gap-2">
            {!collapsed && (
              <div className="flex items-center gap-2 justify-center">
                <Image
                  src="/favicon.ico"
                  alt="GitSprint Logo"
                  width={30}
                  height={30}
                  className="h-7 w-7 sm:h-8 sm:w-8 border border-primary/30 rounded-md p-1"
                />
                <p className="font-medium text-xs sm:text-sm truncate">Happy working!!</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={`h-8 w-8 rounded-full flex-shrink-0 ${collapsed ? "bg-primary text-primary-foreground" : ""}`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
          {/* Header
          <div className="p-4 pb-4 flex items-center gap-2">
            {collapsed && (
              <Link
                href="/"
                className="flex items-center justify-center w-full"
              >
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    L
                  </span>
                </div>
              </Link>
            )}
          </div> */}

          {/* Navigation */}
          <nav className="px-3 py-2 flex-1 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedMenu === item.label;

              return (
                <div key={item.label}>
                  <Button
                    asChild={!hasSubmenu}
                    variant={active ? "secondary" : "ghost"}
                    className={`w-full${collapsed ? "justify-center px-0" : "justify-start px-3"
                      } h-10`}
                    title={collapsed ? item.label : undefined}
                    onClick={() => {
                      if (hasSubmenu) {
                        setExpandedMenu(isExpanded ? null : item.label);
                      }
                    }}
                  >
                    {!hasSubmenu ? (
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 w-full"
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left font-medium">
                              {item.label}
                            </span>
                            {item.badge && item.badge > 0 && (
                              <span className="ml-auto bg-primary text-primary-foreground text-xs font-semibold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left font-medium">
                              {item.label}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 flex-shrink-0 text-muted-foreground ${isExpanded ? "rotate-180" : ""
                                }`}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </Button>

                  {/* Submenu */}
                  {hasSubmenu && isExpanded && !collapsed && item.submenu && (
                    <div className="mt-2 ml-3 pl-3 border-l-2 border-primary/30 space-y-1">
                      {item.submenu.map((subitem) => (
                        <Button
                          key={subitem.href}
                          asChild
                          variant={isActive(subitem.href) ? "default" : "ghost"}
                          className="w-full justify-start text-sm"
                        >
                          <Link
                            href={subitem.href}
                            aria-current={
                              isActive(subitem.href) ? "page" : undefined
                            }
                            onClick={() => setIsOpen(false)}
                          >
                            <span className="h-1 w-1 rounded-full bg-current mr-2" />
                            {subitem.label}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Refresh Sidebar Data Button */}
          {!collapsed && (
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground h-9"
                onClick={() => fetchInvitationCount(true)}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-3 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="text-sm">Refresh Updates</span>
              </Button>
            </div>
          )}

          {/* Bottom Section */}
          <div className="mt-auto p-3 border-t">
            <Button
              variant="ghost"
              className={`w-full text-destructive hover:text-destructive/90 hover:bg-destructive/10 ${collapsed ? "justify-center px-0" : "justify-start px-3"
                }`}
              onClick={signout}
              title={collapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        </aside>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[calc(var(--z-sidebar)-1)] md:hidden overlay-fade-in"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Content Spacer */}
      <div
        className={`hidden md:block transition-all duration-300 ${sidebarWidth}`}
      />
    </>
  );
}
