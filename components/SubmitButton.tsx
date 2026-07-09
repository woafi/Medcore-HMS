"use client";

import { useFormStatus } from "react-dom";
import { LogIn, type LucideIcon } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type SubmitButtonProps = ComponentPropsWithoutRef<"button"> & {
  children?: ReactNode;
  loadingText?: string;
  icon?: LucideIcon;
};

export default function SubmitButton({
  children = "Sign In",
  loadingText = "Signing in...",
  icon: Icon = LogIn,
  className = "",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`
        relative cursor-pointer w-full flex items-center justify-center gap-2
        bg-blue-600 hover:bg-blue-700 active:bg-blue-800
        text-white py-3 px-4 rounded-lg font-semibold
        shadow-lg shadow-blue-600/20 
        transition-all duration-300 
        focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
        ${className}
      `}
      type="submit"
      disabled={pending}
      aria-busy={pending}
      {...props}
    >
      {pending ? (
        <>
          <div
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
            role="status"
            aria-label="Loading"
          />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
