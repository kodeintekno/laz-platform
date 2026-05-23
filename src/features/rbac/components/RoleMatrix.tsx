"use client";

import React, { useState, useTransition } from "react";
import { saveRolePermissionsAction } from "@/features/rbac/actions/rbac.actions";
import { Button } from "@/components/ui";
import { toast } from "@/stores/toast.store";
import type { Prisma } from "@prisma/client";

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
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 rounded-xl bg-white shadow-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-gray-900">
              Module / Permission
            </th>
            {roles.map((role) => (
              <th key={role.id} className="px-4 py-2 text-center font-semibold text-gray-900">
                <Button
                  onClick={() => saveRole(role.id)}
                  size="sm"
                  intent="secondary"
                  isLoading={savingRoleId === role.id}
                  disabled={isPending}
                >
                  Simpan
                </Button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {Object.entries(groupedPermissions)
            .flatMap(([module, perms]) =>
              perms.map((perm) => ({
                ...perm,
                module,
              }))
            )
            .map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2 font-medium">
                  {row.key}
                  <div className="text-xs text-gray-500">{row.description}</div>
                </td>
                {roles.map((role) => {
                  const permId = row.id;
                  const isChecked = activeMappings.has(`${role.id}_${permId}`);
                  return (
                    <td key={role.id} className="px-4 py-2 text-center align-top">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isPending}
                        onChange={() => togglePermission(role.id, permId)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label={`Berikan izin ${row.key} untuk role ${role.name}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
