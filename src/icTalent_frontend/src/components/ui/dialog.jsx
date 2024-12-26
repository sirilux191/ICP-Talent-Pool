import React from "react";
import {
  Dialog as RadixDialog,
  DialogOverlay,
  DialogContent as RadixDialogContent,
} from "@radix-ui/react-dialog";

const Dialog = ({ open, onOpenChange, children }) => {
  return (
    <RadixDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogOverlay className="fixed inset-0 bg-black/30 z-50" />
      <RadixDialogContent className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] bg-background rounded-lg border shadow-lg">
        {children}
      </RadixDialogContent>
    </RadixDialog>
  );
};

export const DialogContent = ({ children }) => (
  <div className="p-6 space-y-4">{children}</div>
);

export const DialogHeader = ({ children }) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle = ({ children }) => (
  <h2 className="text-xl font-semibold">{children}</h2>
);

export default Dialog;
