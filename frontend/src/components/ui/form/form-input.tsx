"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Input, type InputProps } from "@/components/ui/Input";

export interface FormInputProps extends Omit<InputProps, "error"> {
  name: string;
}

export function FormInput({ name, disabled, ...props }: FormInputProps) {
  const { register, formState: { errors, isSubmitting } } = useFormContext();
  const error = errors[name];

  return (
    <Input
      disabled={disabled || isSubmitting}
      error={!!error}
      {...register(name)}
      {...props}
    />
  );
}
