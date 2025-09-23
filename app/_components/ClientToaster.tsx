"use client";

import { Toaster } from "react-hot-toast";

export default function ClientToaster() {
  return <Toaster position="top-center" toastOptions={{ duration: 2500 }} />;
}
