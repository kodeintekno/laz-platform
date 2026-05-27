import React from "react";

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function FormLabel({ children, className = "", ...props }: FormLabelProps) {
  return (
    <label
      className={`block text-sm font-semibold text-secondary mb-1.5 select-none ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
