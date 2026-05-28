"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export interface ActionDropdownItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void | Promise<void>;
  intent?: "info" | "destructive" | "default";
}

interface ActionDropdownProps {
  items: ActionDropdownItem[];
  align?: "left" | "right";
}

export function ActionDropdown({ items, align = "right" }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownWidth = 128; // width of dropdown (w-32 is 128px)
    setCoords({
      top: rect.bottom + 4,
      left: align === "right" ? rect.right - dropdownWidth : rect.left,
    });
    setIsOpen(!isOpen);
  };

  const getIntentStyles = (intent?: "info" | "destructive" | "default") => {
    switch (intent) {
      case "info":
        return "text-info-token hover:bg-surface-muted";
      case "destructive":
        return "text-destructive hover:bg-surface-muted";
      default:
        return "text-secondary hover:text-primary hover:bg-surface-muted";
    }
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className="p-1 cursor-pointer text-secondary hover:text-primary transition-colors bg-transparent border-0 outline-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 rounded-md"
        onClick={handleToggle}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && typeof document !== "undefined" && createPortal(
        <>
          {/* Click-outside backdrop */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown Card */}
          <div
            style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
            className="fixed w-32 p-1 bg-surface/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-xl z-50 animate-scale-in"
          >
            {items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors rounded-xl ${getIntentStyles(
                    item.intent
                  )}`}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
