"use client";

import { useMemo } from "react";
import { OrganizationMemberRole } from "@prisma/client";
import { Permission, hasPermission } from "@/lib/permissions";

export function usePermissions(userRole?: string) {
    const permissions = useMemo(() => {
        if (!userRole) return { can: () => false };

        return {
            can: (permission: Permission) =>
                hasPermission(userRole as OrganizationMemberRole, permission),
        };
    }, [userRole]);

    return permissions;
}
