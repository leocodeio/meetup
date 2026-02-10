"use client"

import * as React from "react"
import { Search, Loader2, ChevronsUpDown, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface User {
    id: string;
    name: string;
    email: string;
    image: string | null;
}

interface ProjectMember {
    id: string;
    userId: string;
    role: string;
    user: User;
}

interface UserMultiSelectProps {
    projectId: string;
    value: string[]; // Array of user IDs
    onChange: (userIds: string[]) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function UserMultiSelect({
    projectId,
    value = [],
    onChange,
    disabled = false,
    placeholder = "Select team members...",
}: UserMultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [members, setMembers] = React.useState<ProjectMember[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Fetch project members when component mounts or projectId changes
    React.useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/projects/${projectId}/members`);
                if (!response.ok) {
                    throw new Error("Failed to fetch project members");
                }
                const data = await response.json();
                setMembers(data.data || []);
            } catch (err) {
                console.error("Error fetching members:", err);
                setError("Failed to load team members");
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchMembers();
        }
    }, [projectId]);

    // Filter members based on search query
    const filteredMembers = React.useMemo(() => {
        if (!searchQuery.trim()) return members;
        const query = searchQuery.toLowerCase();
        return members.filter(
            (member) =>
                member.user.name.toLowerCase().includes(query) ||
                member.user.email.toLowerCase().includes(query)
        );
    }, [members, searchQuery]);

    // Get selected members
    const selectedMembers = React.useMemo(() => {
        return members.filter((member) => value.includes(member.user.id));
    }, [members, value]);

    // Toggle member selection
    const toggleMember = (userId: string) => {
        const newValue = value.includes(userId)
            ? value.filter((id) => id !== userId)
            : [...value, userId];
        onChange(newValue);
    };

    // Remove a specific member
    const removeMember = (userId: string, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onChange(value.filter((id) => id !== userId));
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                    <div
                        role="combobox"
                        aria-expanded={open}
                        aria-controls="user-multi-select-listbox"
                        aria-haspopup="listbox"
                        className={cn(
                            "flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
                            disabled || loading ? "opacity-50 cursor-not-allowed" : ""
                        )}
                        onClick={() => !disabled && !loading && setOpen(!open)}
                    >
                        <div className="flex flex-wrap gap-1 flex-1">
                            {selectedMembers.length === 0 ? (
                                <span className="text-muted-foreground">{placeholder}</span>
                            ) : (
                                selectedMembers.map((member) => (
                                    <Badge
                                        key={member.user.id}
                                        variant="secondary"
                                        className="gap-1 pr-1"
                                    >
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={member.user.image || undefined} />
                                            <AvatarFallback className="text-[8px]">
                                                {member.user.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs">{member.user.name}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => removeMember(member.user.id, e)}
                                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                            )}
                        </div>
                        {loading ? (
                            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
                        ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        )}
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <div className="flex flex-col overflow-hidden rounded-md text-popover-foreground">
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1">
                            {error ? (
                                <div className="py-6 text-center text-sm text-destructive">{error}</div>
                            ) : loading ? (
                                <div className="py-6 text-center text-sm flex justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : filteredMembers.length === 0 ? (
                                <div className="py-6 text-center text-sm">No members found.</div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredMembers.map((member) => {
                                        const isSelected = value.includes(member.user.id);
                                        return (
                                            <div
                                                key={member.user.id}
                                                onClick={() => toggleMember(member.user.id)}
                                                className={cn(
                                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                    isSelected && "bg-accent/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={member.user.image || undefined} />
                                                        <AvatarFallback className="text-xs">
                                                            {member.user.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="text-sm font-medium truncate">
                                                            {member.user.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {member.user.email}
                                                        </span>
                                                    </div>
                                                    <Check
                                                        className={cn(
                                                            "h-4 w-4",
                                                            isSelected ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            {selectedMembers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""} selected
                </p>
            )}
        </div>
    );
}
