"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { CurrencyInput, type CurrencyInputProps } from "@/components/ui/CurrencyInput";

export interface FormCurrencyInputProps extends Omit<CurrencyInputProps, "value" | "onChange" | "error"> {
  name: string;
}

export function FormCurrencyInput({ name, disabled, ...props }: FormCurrencyInputProps) {
  const { control, formState: { errors, isSubmitting } } = useFormContext();
  const error = errors[name];

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange, onBlur, ref } }) => (
        <CurrencyInput
          ref={ref}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled || isSubmitting}
          error={!!error}
          {...props}
        />
      )}
    />
  );
}
