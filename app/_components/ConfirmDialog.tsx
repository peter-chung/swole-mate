"use client";

import React, { useEffect, useRef } from "react";
import Button from "@/app/_components/Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = false,
  confirmLoading = false,
  onCancel,
  onConfirm,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalRef.current) return;

      if (e.key === "Escape") {
        e.preventDefault();
        if (!confirmLoading) onCancel();
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (!confirmLoading) confirmBtnRef.current?.click();
        return;
      }

      if (e.key === "Tab") {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, confirmLoading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 cursor-pointer"
        onClick={() => {
          if (!confirmLoading) onCancel();
        }}
      />
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-sm mx-4 rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {description && (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            ref={cancelBtnRef}
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmBtnRef}
            type="button"
            variant={destructive ? "danger" : "secondary"}
            isLoading={confirmLoading}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

