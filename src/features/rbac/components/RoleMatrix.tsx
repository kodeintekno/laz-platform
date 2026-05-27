"use client";

import React, { useState, useTransition, useMemo, useCallback } from "react";
import { saveRolePermissionsAction } from "@/features/rbac/actions/rbac.actions";
import { Button } from "@/components/ui";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { toast } from "@/stores/toast.store";
import type { Role, Permission } from "@prisma/client";

interface RoleMatrixProps {
  roles: Role[];
  permissions: Permission[];
  initialActiveMappings: Set<string>;
}

type PermissionWithModuleName = Permission & { moduleName: string };

export function RoleMatrix({ roles, permissions, initialActiveMappings }: RoleMatrixProps) {
  const [isPending, startTransition] = useTransition();
  const [activeMappings, setActiveMappings] = useState<Set<string>>(initialActiveMappings);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  // Group permissions by moduleName (extracted from key like "users.read" -> "users")
  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, perm) => {
      const moduleName = perm.key.split(".")[0];
      if (!acc[moduleName]) acc[moduleName] = [];
      acc[moduleName].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);
  }, [permissions]);

  const flatPermissions = useMemo(() => {
    return Object.entries(groupedPermissions).flatMap(([moduleName, perms]) =>
      perms.map((perm) => ({
        ...perm,
        moduleName,
      }))
    );
  }, [groupedPermissions]);

  const togglePermission = useCallback((roleId: string, permissionId: string) => {
    const key = `${roleId}_${permissionId}`;
    setActiveMappings((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const saveRole = useCallback((roleId: string) => {
    setSavingRoleId(roleId);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("roleId", roleId);
      
      // Add all currently active permissions for this role
      Array.from(activeMappings).forEach((mapping) => {
        if (mapping.startsWith(`${roleId}_`)) {
          const permId = mapping.replace(`${roleId}_`, "");
          formData.append(`permissions_${roleId}`, permId);
        }
      });

      const result = await saveRolePermissionsAction(formData);
      
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Permissions berhasil disimpan!");
      }
      setSavingRoleId(null);
    });
  }, [activeMappings]);

  const columns: ColumnDef<PermissionWithModuleName>[] = useMemo(() => [
    {
      header: "Module / Permission",
      cell: (row) => (
        <div className="font-semibold text-text-primary py-1">
          {row.key}
          <div className="text-xs text-text-secondary font-normal mt-0.5">{row.description}</div>
        </div>
      ),
    },
    ...roles.map((role) => ({
      header: (
        <div className="flex flex-col items-center gap-2 py-1">
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{role.name}</span>
          <Button
            onClick={() => saveRole(role.id)}
            size="sm"
            intent="secondary"
            isLoading={savingRoleId === role.id}
            disabled={isPending}
            className="text-xs py-1 px-2.5 h-auto rounded-lg"
          >
            Simpan
          </Button>
        </div>
      ),
      align: "center" as const,
      cell: (row: PermissionWithModuleName) => {
        const permId = row.id;
        const isChecked = activeMappings.has(`${role.id}_${permId}`);
        return (
          <div className="flex justify-center items-center h-full">
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isPending}
              onChange={() => togglePermission(role.id, permId)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              aria-label={`Berikan izin ${row.key} untuk role ${role.name}`}
            />
          </div>
        );
      },
    })),
  ], [roles, activeMappings, isPending, savingRoleId, saveRole, togglePermission]);

  return (
    <DataTable
      columns={columns}
      data={flatPermissions}
      emptyTitle="Tidak ada data permissions"
      emptyDescription="Sistem RBAC tidak mendeteksi adanya data permissions."
    />
  );
}
