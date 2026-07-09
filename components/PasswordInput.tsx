"use client";

import { useState, type ComponentPropsWithoutRef } from "react";

type PasswordInputProps = ComponentPropsWithoutRef<"input"> & {
  error?: string;
};

export default function PasswordInput({
  error,
  ...rest
}: PasswordInputProps) {
  const [isShown, setIsShown] = useState(false);

  const handleShownPassword = () => setIsShown((prev) => !prev);

  return (
    <div>
      <div className="flex justify-start items-center mb-1">
        <label
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          htmlFor="password"
        >
          Password
        </label>
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <input
          className={`block w-full pl-10 pr-10 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all focus:placeholder-transparent ${error ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-600 border-gray-300 dark:border-gray-700"}`}
          type={isShown ? "text" : "password"}
          {...rest}
        />
        <div
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
          onClick={handleShownPassword}
        >
          {isShown ? (
            <svg
              className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
              <line
                x1="3"
                y1="3"
                x2="21"
                y2="21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
      {error && (
        <p
          className={`mt-1.5 text-sm ${error ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
