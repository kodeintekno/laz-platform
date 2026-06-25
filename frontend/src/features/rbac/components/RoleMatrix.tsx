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
  initialActiveMappings: string[];
}

type PermissionWithModuleName = Permission & { moduleName: string };

export function RoleMatrix({ roles, permissions, initialActiveMappings }: RoleMatrixProps) {
  const [isPending, startTransition] = useTransition();
  const [activeMappings, setActiveMappings] = useState<Set<string>>(() => new Set(initialActiveMappings));
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  // Filter out SUPER_ADMIN from editable roles
  const editableRoles = useMemo(() => {
    return roles.filter((role) => role.name !== "SUPER_ADMIN");
  }, [roles]);

  const [selectedRoleId, setSelectedRoleId] = useState<string>(editableRoles[0]?.id || "");

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
      header: "Izin Akses",
      width: "350px",
      cell: (row) => (
        <div className="py-1 flex flex-col gap-1">
          <div className="font-semibold text-primary text-sm leading-snug">{row.description || row.key}</div>
          <div>
            <code className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-surface-soft border border-border/50 text-secondary font-mono leading-none">
              {row.key}
            </code>
          </div>
        </div>
      ),
    },
    ...editableRoles.map((role) => ({
      header: (
        <div className="flex flex-col items-center gap-2 py-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">{role.name}</span>
          <Button
            onClick={() => saveRole(role.id)}
            size="sm"
            intent="outline"
            isLoading={savingRoleId === role.id}
            disabled={isPending}
            className="text-[10px] py-1 px-3 h-auto rounded-xl font-bold"
          >
            Simpan
          </Button>
        </div>
      ),
      width: "150px",
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
              className="h-4 w-4 rounded border border-secondary/40 accent-brand-primary cursor-pointer transition"
              aria-label={`Berikan izin ${row.key} untuk role ${role.name}`}
            />
          </div>
        );
      },
    })),
  ], [editableRoles, activeMappings, isPending, savingRoleId, saveRole, togglePermission]);

  const getModuleLabel = (name: string) => {
    const labels: Record<string, string> = {
      users: "Pengguna & Keanggotaan",
      roles: "Hak Akses & Role",
      laz: "Lembaga Amil Zakat (LAZ)",
      donations: "Transaksi Donasi & Zakat",
      programs: "Program Pendayagunaan",
      distributions: "Penyaluran Dana",
    };
    return labels[name.toLowerCase()] || name.toUpperCase();
  };

  const selectedRoleName = editableRoles.find((r) => r.id === selectedRoleId)?.name || "";

  return (
    <div className="w-full space-y-6">
      {/* Desktop view (>= 1024px) */}
      <div className="hidden lg:block w-full">
        <DataTable
          columns={columns}
          data={flatPermissions}
          emptyTitle="Tidak ada data permissions"
          emptyDescription="Sistem RBAC tidak mendeteksi adanya data permissions."
        />
      </div>

      {/* Mobile & Tablet view (< 1024px) */}
      <div className="lg:hidden space-y-6 w-full">
        {/* Role Horizontal Tab Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6">
          {editableRoles.map((role) => {
            const isActive = selectedRoleId === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRoleId(role.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  isActive
                    ? "bg-brand-primary text-white shadow-sm"
                    : "bg-surface text-secondary hover:text-primary border border-border/50"
                }`}
              >
                {role.name}
              </button>
            );
          })}
        </div>

        {/* Permissions Lists Grouped by Module */}
        <div className="space-y-6 pb-20">
          {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
            <div key={moduleName} className="bg-surface rounded-2xl border border-border/40 shadow-sm overflow-hidden">
              {/* Module Header */}
              <div className="bg-surface-soft px-4 py-3 border-b border-border/40">
                <h3 className="text-sm font-bold text-primary">{getModuleLabel(moduleName)}</h3>
              </div>
              
              {/* Module Items */}
              <div className="divide-y divide-border/20">
                {perms.map((perm) => {
                  const isChecked = activeMappings.has(`${selectedRoleId}_${perm.id}`);
                  return (
                    <label
                      key={perm.id}
                      className="flex items-start gap-3 p-4 hover:bg-surface-muted transition cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isPending}
                        onChange={() => togglePermission(selectedRoleId, perm.id)}
                        className="h-5 w-5 mt-0.5 rounded border border-secondary/40 accent-brand-primary cursor-pointer transition flex-shrink-0"
                        aria-label={`Berikan izin ${perm.key} untuk role ${selectedRoleName}`}
                      />
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="text-sm font-semibold text-primary leading-snug">{perm.description || perm.key}</div>
                        <div>
                          <code className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-surface-soft border border-border/50 text-secondary font-mono leading-none">
                            {perm.key}
                          </code>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Floating/Sticky Save Button Bar at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden p-4 bg-surface/90 backdrop-blur-md border-t border-border/40 shadow-lg z-30 flex justify-end">
          <Button
            onClick={() => saveRole(selectedRoleId)}
            isLoading={savingRoleId === selectedRoleId}
            disabled={isPending}
            size="md"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold bg-brand-primary text-white text-sm"
          >
            Simpan Hak Akses: {selectedRoleName}
          </Button>
        </div>
      </div>
    </div>
  );
}
