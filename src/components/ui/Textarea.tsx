import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error = false, disabled, ...props }, ref) => {
    const baseStyle =
      "block w-full rounded-xl border py-2.5 px-4 text-foreground bg-background placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none transition duration-150 sm:text-sm sm:leading-6";

    const stateStyle = error
      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
      : "border-border focus:border-primary focus:ring-primary/30";

    return (
      <textarea
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        className={`${baseStyle} ${stateStyle} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
