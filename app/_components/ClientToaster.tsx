"use client";

import { Toaster } from "react-hot-toast";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ClientToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2500,
        style: {
          background: "#18181b",
          color: "#f4f4f5",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0.625rem",
          padding: "0.75rem 1rem",
          fontSize: "0.875rem",
          fontWeight: "500",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          maxWidth: "380px",
          gap: "0.25rem",
        },
        success: {
          icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />,
        },
        error: {
          icon: <XCircle className="h-4 w-4 shrink-0 text-red-400" />,
        },
      }}
    />
  );
}
