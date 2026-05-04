"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { startDemo } from "@/app/(auth)/demo/actions";
import Button, { type ButtonSize } from "@/app/_components/Button";
import toast from "react-hot-toast";

export default function DemoButton({
  className,
  size = "lg",
}: {
  className?: string;
  size?: ButtonSize;
}) {
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
    <Button
      variant="secondary"
      size={size}
      isLoading={isLoading}
      onClick={handleClick}
      className={className}
    >
      <Zap size={13} />
      Try Demo
    </Button>
  );
}
