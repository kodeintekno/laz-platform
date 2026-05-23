"use client";
import { useState, useCallback } from "react";

export const useDialog = (initialOpen = false) => {
  const [open, setOpen] = useState(initialOpen);
  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => setOpen(false), []);
  const toggleDialog = useCallback(() => setOpen((prev) => !prev), []);
  return { open, setOpen, openDialog, closeDialog, toggleDialog };
};
