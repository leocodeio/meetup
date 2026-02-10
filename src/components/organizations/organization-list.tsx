"use client";

import { useState, useEffect, useMemo } from "react";
import { Organization } from "@/types/organization";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Grid3x3, List } from "lucide-react";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { EditOrganizationDialog } from "./edit-organization-dialog";
import { DeleteOrganizationDialog } from "./delete-organization-dialog";
import { debounce } from "@/lib/utils/debounce";

interface OrganizationListProps {
  initialOrganizations: (Organization & { memberCount: number })[];
  onUpdate?: () => void;
  currentUserId: string;
}

type ViewMode = "grid" | "list";

/**
 * Organization List/Grid Component with Search
 * Displays organizations in grid or list view with search functionality
 */
export function OrganizationList({
  initialOrganizations,
  onUpdate,
  currentUserId,
}: OrganizationListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [isSearching, setIsSearching] = useState(false);

  // Sync local state when initialOrganizations prop changes
  useEffect(() => {
    setOrganizations(initialOrganizations);
  }, [initialOrganizations]);

  // Debounced search handler - create stable debounced function
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query);
      if (query.trim() === "") {
        setOrganizations(initialOrganizations);
        return;
      }

      setIsSearching(true);
      fetch(`/api/organizations?query=${encodeURIComponent(query)}&limit=100`)
        .then(response => response.ok ? response.json() : Promise.reject(response))
        .then(data => setOrganizations(data.data?.organizations || []))
        .catch(error => console.error("Search failed:", error))
        .finally(() => setIsSearching(false));
    }, 300),
    [initialOrganizations]
  );

  // Filter organizations based on search query
  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    onUpdate?.();
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and View Toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations by name or slug..."
            value={searchQuery}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="pl-10"
            disabled={isSearching}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <CreateOrganizationDialog onSuccess={handleRefresh} />
        </div>
      </div>

      {/* Empty State */}
      {filteredOrganizations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "No organizations found matching your search"
              : "No organizations yet."}
          </p>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredOrganizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrganizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              onUpdate={handleRefresh}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && filteredOrganizations.length > 0 && (
        <div className="space-y-2">
          {filteredOrganizations.map((org) => (
            <OrganizationListItem
              key={org.id}
              organization={org}
              onUpdate={handleRefresh}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Organization Card for Grid View
 */
function OrganizationCard({
  organization,
  onUpdate,
  currentUserId,
}: {
  organization: Organization & { memberCount: number };
  onUpdate: () => void;
  currentUserId: string;
}) {
  const isOwner = organization.ownerId === currentUserId;
  const firstLetter = organization.name.charAt(0).toUpperCase();

  return (
    <Card className="p-5 hover:shadow-md transition-all duration-200 border-border/50">
      {/* Header: Avatar + Content + Date */}
      <div className="flex items-start gap-4">
        {/* Left: Avatar */}
        <div className="flex-shrink-0">
          {organization.image ? (
            <Avatar className="h-11 w-11 rounded-xl border border-border">
              <AvatarImage src={organization.image} alt={organization.name} />
              <AvatarFallback className="text-sm font-semibold bg-muted">
                {firstLetter}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-11 w-11 rounded-xl border border-border bg-muted/50">
              <AvatarFallback className="text-sm font-semibold">
                {firstLetter}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Middle: Content Block */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-[15px] leading-snug truncate text-foreground">
            {organization.name}
          </h3>

          {/* Subtitle (Optional) */}
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {organization.description || `@${organization.slug}`}
          </p>

          {/* Date & Members */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {new Date(organization.createdAt).toLocaleDateString()}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {organization.memberCount} members
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        {isOwner && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <EditOrganizationDialog organization={organization} onSuccess={onUpdate} />
            <DeleteOrganizationDialog organization={organization} onSuccess={onUpdate} />
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Organization List Item for List View
 */
function OrganizationListItem({
  organization,
  onUpdate,
  currentUserId,
}: {
  organization: Organization & { memberCount: number };
  onUpdate: () => void;
  currentUserId: string;
}) {
  const isOwner = organization.ownerId === currentUserId;
  const firstLetter = organization.name.charAt(0).toUpperCase();

  return (
    <Card className="p-4 hover:shadow-sm transition-all duration-200 border-border/50">
      <div className="flex items-center gap-4">
        {/* Left: Avatar */}
        <div className="flex-shrink-0">
          {organization.image ? (
            <Avatar className="h-10 w-10 rounded-lg border border-border">
              <AvatarImage src={organization.image} alt={organization.name} />
              <AvatarFallback className="text-sm font-semibold bg-muted">
                {firstLetter}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-10 w-10 rounded-lg border border-border bg-muted/50">
              <AvatarFallback className="text-sm font-semibold">
                {firstLetter}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Middle: Content Block */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-[15px] leading-snug truncate text-foreground">
            {organization.name}
          </h3>

          {/* Subtitle (Optional) */}
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {organization.description || `@${organization.slug}`}
          </p>
        </div>

        {/* Right: Date + Members + Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Date & Members */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(organization.createdAt).toLocaleDateString()}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-medium">
              {organization.memberCount} members
            </span>
          </div>

          {/* Actions */}
          {isOwner && (
            <div className="flex items-center gap-1">
              <EditOrganizationDialog organization={organization} onSuccess={onUpdate} />
              <DeleteOrganizationDialog organization={organization} onSuccess={onUpdate} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
