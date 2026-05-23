"use client";
import React, { ReactNode } from "react";

export interface DialogFooterProps {
  children: ReactNode;
}

export const DialogFooter = ({ children }: DialogFooterProps) => (
  <div className="flex justify-end space-x-2 p-4 border-t border-border">
    {children}
  </div>
);
