import React from "react";

interface FormErrorProps {
  id?: string;
  message?: string;
  className?: string;
}

export function FormError({ id, message, className = "" }: FormErrorProps) {
  if (!message) return null;
  return (
    <p
      id={id}
      className={`mt-1.5 text-xs font-semibold text-destructive dark:text-red-450 ${className}`}
      aria-live="polite"
    >
      {message}
    </p>
  );
}
