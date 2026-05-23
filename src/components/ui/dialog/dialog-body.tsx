"use client";
import React, { ReactNode } from "react";

export interface DialogBodyProps {
  children: ReactNode;
}

export const DialogBody = ({ children }: DialogBodyProps) => (
  <div className="p-4 overflow-y-auto max-h-[60vh]">{children}</div>
);
