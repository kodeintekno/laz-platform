import React from "react";

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-primary leading-tight">
          {title}
        </h1>
        {description && (
          <div className="text-sm text-secondary max-w-4xl leading-relaxed">
            {description}
          </div>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
