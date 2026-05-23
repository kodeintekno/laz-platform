"use client";
import React, { ReactNode } from "react";

export interface DialogHeaderProps {
  children: ReactNode;
}

export const DialogHeader = ({ children }: DialogHeaderProps) => (
  <div className="flex items-center justify-between p-4 border-b border-border">
    {children}
  </div>
);
