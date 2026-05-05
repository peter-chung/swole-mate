"use client";

import { useState } from "react";
import { startDemo } from "@/app/(auth)/demo/actions";
import toast from "react-hot-toast";

export default function DemoBannerLink() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const result = await startDemo();
    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="font-semibold underline decoration-[#3ecf8e]/50 underline-offset-2 hover:no-underline disabled:opacity-60"
    >
      {isLoading ? "Starting…" : "Try the demo →"}
    </button>
  );
}
