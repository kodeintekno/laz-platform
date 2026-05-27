"use client";
import { Dialog } from "./dialog";
import { DialogBody } from "./dialog-body";
import { DialogFooter } from "./dialog-footer";
import { Button } from "../Button";

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  okLabel?: string;
}

export const AlertDialog = ({
  open,
  onOpenChange,
  title,
  description,
  okLabel = "OK",
}: AlertDialogProps) => (
  <Dialog isOpen={open} onClose={() => onOpenChange(false)} title={title}>
    {description && <DialogBody>{description}</DialogBody>}
    <DialogFooter>
      <Button intent="primary" onClick={() => onOpenChange(false)}>{okLabel}</Button>
    </DialogFooter>
  </Dialog>
);
