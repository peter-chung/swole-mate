"use client";

import { forwardRef } from "react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-normal transition-all ease-out duration-200 cursor-pointer focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed active:translate-y-px";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[#006239] border border-[#3ecf8e]/30 text-[#fafafa] hover:bg-[#3ecf8e]/50 hover:border-[#3ecf8e] focus:ring-[#3ecf8e]/40",
  secondary:
    "border border-neutral-700 bg-transparent text-neutral-100 hover:bg-neutral-800 focus:ring-neutral-500/40",
  danger:
    "border border-red-900 bg-transparent text-red-400 hover:bg-red-950/30 focus:ring-red-500/40",
  ghost:
    "border border-transparent bg-transparent text-neutral-300 hover:bg-neutral-900/40 focus:ring-neutral-500/40",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3 text-sm",
  lg: "h-10 px-4 text-sm",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      isLoading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 size={14} className="animate-spin" /> : children}
    </button>
  ),
);

Button.displayName = "Button";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

export default Button;
