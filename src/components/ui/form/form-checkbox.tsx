"use client";

import React from "react";
import { Controller, useFormContext } from "react-hook-form";

export interface FormCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "name"> {
  name: string;
  label?: string;
  description?: string;
}

export function FormCheckbox({ name, label, description, disabled, ...props }: FormCheckboxProps) {
  const { control, formState: { isSubmitting } } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <label className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border cursor-pointer hover:bg-muted/55 transition select-none w-full">
          <div className="flex h-6 items-center">
            <input
              type="checkbox"
              checked={!!field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled || isSubmitting}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
              {...props}
            />
          </div>
          {(label || description) && (
            <div className="text-sm leading-5">
              {label && <span className="font-semibold text-foreground">{label}</span>}
              {description && <p className="text-text-muted mt-0.5">{description}</p>}
            </div>
          )}
        </label>
      )}
    />
  );
}
