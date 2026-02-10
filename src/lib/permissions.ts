import { OrganizationMemberRole } from "@prisma/client";

export type Permission =
    | "org:edit"
    | "org:delete"
    | "org:manage_members"
    | "project:create"
    | "project:edit"
    | "project:delete"
    | "sprint:create"
    | "sprint:edit"
    | "sprint:delete"
    | "story:create"
    | "story:edit"
    | "story:delete";

export const ROLE_PERMISSIONS: Record<OrganizationMemberRole, Permission[]> = {
    OWNER: [
        "org:edit",
        "org:delete",
        "org:manage_members",
        "project:create",
        "project:edit",
        "project:delete",
        "sprint:create",
        "sprint:edit",
        "sprint:delete",
        "story:create",
        "story:edit",
        "story:delete",
    ],
    ADMIN: [
        "org:edit",
        "org:manage_members",
        "project:create",
        "project:edit",
        "project:delete",
        "sprint:create",
        "sprint:edit",
        "sprint:delete",
        "story:create",
        "story:edit",
        "story:delete",
    ],
    MEMBER: [
        "project:edit",
        "sprint:create",
        "sprint:edit",
        "story:create",
        "story:edit",
        "story:delete",
    ],
};

export function hasPermission(
    role: OrganizationMemberRole,
    permission: Permission
): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
}
