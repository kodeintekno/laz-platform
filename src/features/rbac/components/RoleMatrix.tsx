"use client";

import React, { useState, useTransition } from "react";
import { saveRolePermissionsAction } from "@/features/rbac/actions/rbac.actions";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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
        alert(result.error);
        // Fallback: reset to initial if failed (in a real app, you'd fetch latest state)
      } else {
        alert("Permissions berhasil disimpan!");
      }
      setSavingRoleId(null);
    });
  };

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 sticky left-0 bg-gray-50 z-10 w-64">
              Module / Permission
            </th>
            {roles.map((role) => (
              <th key={role.id} scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900 min-w-[120px]">
                <div className="flex flex-col items-center gap-2">
                  <span>{role.name}</span>
                  <button
                    onClick={() => saveRole(role.id)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100 disabled:opacity-50"
                  >
                    {savingRoleId === role.id ? <LoadingSpinner size="sm" /> : "Simpan"}
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {Object.entries(groupedPermissions).map(([module, perms]) => (
            <React.Fragment key={module}>
              {/* Module Header Row */}
              <tr className="bg-gray-50/50">
                <td colSpan={roles.length + 1} className="py-2 pl-4 pr-3 text-xs font-bold uppercase tracking-wider text-gray-500 sm:pl-6">
                  {module}
                </td>
              </tr>
              {/* Permission Rows */}
              {perms.map((perm) => (
                <tr key={perm.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm text-gray-900 sm:pl-6 sticky left-0 bg-white z-10">
                    <div className="font-medium">{perm.key}</div>
                    <div className="text-xs text-gray-500">{perm.description}</div>
                  </td>
                  {roles.map((role) => {
                    const isChecked = activeMappings.has(`${role.id}_${perm.id}`);
                    return (
                      <td key={`${role.id}_${perm.id}`} className="whitespace-nowrap px-3 py-3 text-center text-sm text-gray-500">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(role.id, perm.id)}
                          disabled={isPending}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50 cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
