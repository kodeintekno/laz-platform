"use client";

import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FormError } from "./form-error";

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
      render={({ field, fieldState: { error } }) => (
        <div className="w-full">
          <label className={`flex items-start gap-3 p-4 rounded-xl bg-surface-muted/30 border cursor-pointer hover:bg-surface-muted/55 transition select-none w-full ${error ? "border-destructive/50" : "border-border/40"}`}>
            <div className="flex h-6 items-center">
              <input
                type="checkbox"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                onBlur={field.onBlur}
                disabled={disabled || isSubmitting}
                className={`h-4 w-4 rounded border accent-brand-primary cursor-pointer disabled:opacity-50 ${error ? "border-destructive/50" : "border-secondary/40"}`}
                {...props}
              />
            </div>
            {(label || description) && (
              <div className="text-sm leading-5">
                {label && <span className={`font-semibold ${error ? "text-destructive" : "text-primary"}`}>{label}</span>}
                {description && <p className="text-muted mt-0.5">{description}</p>}
              </div>
            )}
          </label>
          <FormError message={error?.message} />
        </div>
      )}
    />
  );
}
