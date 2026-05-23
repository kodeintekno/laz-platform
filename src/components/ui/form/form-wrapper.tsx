"use client";

import React from "react";
import { useForm, FormProvider, type UseFormReturn, type DefaultValues, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type z } from "zod";
import { Alert } from "@/components/ui/Alert";

export interface FormWrapperProps<TFieldValues extends FieldValues> {
  schema: z.Schema<TFieldValues> | any;
  onSubmit: (values: TFieldValues, form: UseFormReturn<TFieldValues>) => void | Promise<void>;
  defaultValues?: DefaultValues<TFieldValues>;
  children: React.ReactNode;
  className?: string;
  id?: string;
  error?: string | null;
}

export function FormWrapper<TFieldValues extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  children,
  className = "space-y-4",
  id,
  error,
}: FormWrapperProps<TFieldValues>) {
  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  const { handleSubmit, formState: { isSubmitting } } = form;

  return (
    <FormProvider {...form}>
      <form
        id={id}
        onSubmit={handleSubmit(async (values) => {
          try {
            await onSubmit(values, form);
          } catch (err) {
            console.error("Form submit wrapper captured error:", err);
          }
        })}
        className={className}
      >
        {error && (
          <Alert intent="error" className="mb-4">
            {error}
          </Alert>
        )}
        
        <fieldset disabled={isSubmitting} className="space-y-4 w-full border-none p-0 m-0">
          {children}
        </fieldset>
      </form>
    </FormProvider>
  );
}
