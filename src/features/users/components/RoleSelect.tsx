"use client";

import { useTransition, useRef } from "react";
import { changeUserRoleAction } from "@/features/users/actions/users.actions";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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
          alert(res.error); // Fallback error handling
          // Reset select to original value if failed
          formRef.current?.reset();
        }
      });
    }
  };

  return (
    <form ref={formRef} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="roleId"
        defaultValue={currentRoleId}
        onChange={handleChange}
        disabled={isPending || disabled}
        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6 disabled:opacity-50"
      >
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      {isPending && <LoadingSpinner size="sm" />}
    </form>
  );
}
