"use client";

import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { FormLabel } from "./form-label";
import { FormError } from "./form-error";
import { FormInput } from "./form-input";
import { FormTextarea } from "./form-textarea";
import { FormSelect } from "./form-select";
import { FormCheckbox } from "./form-checkbox";
import { FormCurrencyInput } from "./form-currency-input";

export interface FormFieldProps {
  name: string;
  label?: string;
  type: "input" | "textarea" | "select" | "checkbox" | "custom" | "currency";
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  options?: { label: string; value: string | number }[];
  className?: string;
  render?: (fieldProps: any) => React.ReactNode;
  children?: React.ReactNode;
  inputType?: string;
  [key: string]: any;
}

export function FormField({
  name,
  label,
  type,
  placeholder,
  description,
  disabled,
  options,
  className = "space-y-1.5",
  render,
  children,
  inputType,
  ...props
}: FormFieldProps) {
  const { formState: { errors }, control } = useFormContext();
  const error = errors[name];
  const fieldId = `form-field-${name}`;
  const errorId = `${fieldId}-error`;
  const descId = `${fieldId}-desc`;

  const errorMessage = error?.message ? String(error.message) : undefined;

  const renderField = () => {
    switch (type) {
      case "input":
        return (
          <FormInput
            id={fieldId}
            name={name}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            aria-describedby={`${description ? descId : ""} ${error ? errorId : ""}`.trim()}
            {...props}
          />
        );
      case "currency":
        return (
          <FormCurrencyInput
            id={fieldId}
            name={name}
            placeholder={placeholder}
            disabled={disabled}
            aria-describedby={`${description ? descId : ""} ${error ? errorId : ""}`.trim()}
            {...props}
          />
        );
      case "textarea":
        return (
          <FormTextarea
            id={fieldId}
            name={name}
            placeholder={placeholder}
            disabled={disabled}
            aria-describedby={`${description ? descId : ""} ${error ? errorId : ""}`.trim()}
            {...props}
          />
        );
      case "select":
        return (
          <FormSelect
            id={fieldId}
            name={name}
            options={options}
            disabled={disabled}
            aria-describedby={`${description ? descId : ""} ${error ? errorId : ""}`.trim()}
            {...props}
          >
            {children}
          </FormSelect>
        );
      case "checkbox":
        return (
          <FormCheckbox
            id={fieldId}
            name={name}
            label={label}
            description={description}
            disabled={disabled}
            {...props}
          />
        );
      case "custom":
        if (!render) return null;
        return (
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <>
                {render({
                  field,
                  fieldId,
                  errorId,
                  descId,
                  error: !!error,
                })}
              </>
            )}
          />
        );
      default:
        return null;
    }
  };

  const shouldRenderOuterLabel = label && type !== "checkbox";

  return (
    <div className={className}>
      {shouldRenderOuterLabel && (
        <FormLabel htmlFor={fieldId}>{label}</FormLabel>
      )}

      {renderField()}

      {description && type !== "checkbox" && (
        <p id={descId} className="text-[11px] text-muted leading-tight">
          {description}
        </p>
      )}

      {errorMessage && (
        <FormError id={errorId} message={errorMessage} />
      )}
    </div>
  );
}
