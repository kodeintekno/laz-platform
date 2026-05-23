"use client";

import React, { useState, useTransition } from "react";
import { saveRolePermissionsAction } from "@/features/rbac/actions/rbac.actions";
import { Button } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import type { Prisma } from "@prisma/client";
import { DataTable } from "@/components/ui/data-table";
import { FormCheckbox } from "@/components/ui/form";
interface RoleMatrixProps {
  roles: Prisma.RoleGetPayload<{}>[];
  permissions: Prisma.PermissionGetPayload<{}>[];
  initialActiveMappings: Set<string>;
}

export function RoleMatrix({ roles, permissions, initialActiveMappings }: RoleMatrixProps) {
  const [isPending, startTransition] = useTransition();
  const [activeMappings, setActiveMappings] = useState<Set<string>>(initialActiveMappings);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  // Group permissions by module (extracted from key like "users.read" -> "users")
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const module = perm.key.split(".")[0];
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  const togglePermission = (roleId: string, permissionId: string) => {
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
  };

  const saveRole = (roleId: string) => {
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
  };

  return (
    <DataTable
      columns={[
        {
          header: "Module / Permission",
          accessor: "key",
          cell: (row: any) => (
            <div className="font-medium">
              {row.key}
              <div className="text-xs text-gray-500">{row.description}</div>
            </div>
          ),
        },
        ...roles.map((role) => ({
          header: () => (
            <Button
              onClick={() => saveRole(role.id)}
              size="sm"
              intent="secondary"
              isLoading={savingRoleId === role.id}
              disabled={isPending}
            >
              Simpan
            </Button>
          ),
          accessor: role.id,
          cell: (row: any) => {
            const permId = row.id;
            const isChecked = activeMappings.has(`${role.id}_${permId}`);
            return (
              <FormCheckbox
                name={`${role.id}_${permId}`}
                checked={isChecked}
                onChange={() => togglePermission(role.id, permId)}
                disabled={isPending}
                aria-label={`Berikan izin ${row.key} untuk role ${role.name}`}
              />
            );
          },
        })),
      ]}
      data={Object.entries(groupedPermissions).flatMap(([module, perms]) =>
        perms.map((perm) => ({
          ...perm,
          module,
        }))
      )}
      loading={isPending}
    />
  );
}
