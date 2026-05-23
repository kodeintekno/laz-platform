"use client";

import React, { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalRoot = typeof document !== "undefined" ? document.body : null;
  if (!modalRoot) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl border border-border flex flex-col"
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground" id="dialog-title">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    modalRoot
  );
}
