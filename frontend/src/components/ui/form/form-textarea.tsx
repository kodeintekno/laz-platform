"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Textarea, type TextareaProps } from "@/components/ui/Textarea";

export interface FormTextareaProps extends Omit<TextareaProps, "error"> {
  name: string;
}

export function FormTextarea({ name, disabled, ...props }: FormTextareaProps) {
  const { register, formState: { errors, isSubmitting } } = useFormContext();
  const error = errors[name];

  return (
    <Textarea
      disabled={disabled || isSubmitting}
      error={!!error}
      {...register(name)}
      {...props}
    />
  );
}
