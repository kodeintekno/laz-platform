"use client";
import React from "react";
import { Dialog } from "./dialog";
import { DialogBody } from "./dialog-body";
import { DialogFooter } from "./dialog-footer";
import { Button } from "../Button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
}: ConfirmDialogProps) => {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog isOpen={open} onClose={() => onOpenChange(false)} title={title}>
      {description && <DialogBody>{description}</DialogBody>}
      <DialogFooter>
        <Button intent="outline" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button intent="primary" onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
