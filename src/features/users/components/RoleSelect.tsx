"use client";

import { useTransition, useRef } from "react";
import { changeUserRoleAction } from "@/features/users/actions/users.actions";
import { Select } from "@/components/ui/Select";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { toast } from "@/stores/toast.store";

interface RoleSelectProps {
  userId: string;
  currentRoleId: string;
  roles: { id: string; name: string }[];
  disabled?: boolean;
}

export function RoleSelect({ userId, currentRoleId, roles, disabled }: RoleSelectProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = () => {
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      startTransition(async () => {
        const res = await changeUserRoleAction(formData);
        if (res?.error) {
          toast.error(res.error);
          // Reset select to original value if failed
          formRef.current?.reset();
        } else {
          toast.success("Role pengguna berhasil diperbarui");
        }
      });
    }
  };

  return (
    <form ref={formRef} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Select
        name="roleId"
        defaultValue={currentRoleId}
        onChange={handleChange}
        disabled={isPending || disabled}
        className="w-48"
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </Select>
      {isPending && <LoadingSpinner size="sm" />}
    </form>
  );
}

