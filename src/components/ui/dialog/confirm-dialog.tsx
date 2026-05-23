"use client";
import React from "react";
import { Dialog } from "./dialog";
import { DialogHeader } from "./dialog-header";
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
    <Dialog open={open} onOpenChange={onOpenChange} title={title}>
      {description && <DialogBody>{description}</DialogBody>}
      <DialogFooter>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
