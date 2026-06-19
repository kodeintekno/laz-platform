"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Select, type SelectProps } from "@/components/ui/Select";

export interface FormSelectProps extends Omit<SelectProps, "error"> {
  name: string;
  options?: { label: string; value: string | number }[];
}

export function FormSelect({ name, options = [], disabled, children, ...props }: FormSelectProps) {
  const { register, formState: { errors, isSubmitting } } = useFormContext();
  const error = errors[name];

  return (
    <Select
      disabled={disabled || isSubmitting}
      error={!!error}
      {...register(name)}
      {...props}
    >
      {children ? children : options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}
