"use client";

import React from "react";
import { OrganizationMemberRole } from "@prisma/client";
import { Permission, hasPermission } from "@/lib/permissions";

interface PermissionGateProps {
    permission: Permission;
    role?: OrganizationMemberRole | null;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * A component that conditionally renders its children based on the user's role and a required permission.
 * 
 * @param permission The permission required to view the children.
 * @param role The current user's role in the organization/project.
 * @param children The content to show if the user has the permission.
 * @param fallback Optional content to show if the user does NOT have the permission.
 */
export function PermissionGate({
    permission,
    role,
    children,
    fallback = null,
}: PermissionGateProps) {
    // If no role is provided or it's null, we assume no permission
    if (!role) {
        return <>{fallback}</>;
    }

    const authorized = hasPermission(role, permission);

    if (authorized) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
