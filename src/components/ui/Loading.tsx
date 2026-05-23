import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export interface LoadingProps {
  message?: string;
  fullHeight?: boolean;
}

export function Loading({ message = "Memuat data...", fullHeight = true }: LoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 gap-3 w-full ${
        fullHeight ? "min-h-[50vh]" : ""
      }`}
    >
      <LoadingSpinner size="lg" />
      {message && (
        <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
}
