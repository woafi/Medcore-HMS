"use client";

type FormInputProps = {
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: boolean;
};

export default function FormInput({
  id,
  name,
  type = "text",
  placeholder = "",
  defaultValue = "",
  disabled = false,
  error = false,
}: FormInputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      defaultValue={defaultValue}
      disabled={disabled}
      placeholder={placeholder}
      required
      className={`block w-full pl-10 pr-10 py-3 border rounded-lg 
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-white 
      placeholder-gray-400 
      focus:outline-none focus:ring-2 focus:border-transparent 
      transition-all focus:placeholder-transparent 
      ${
        error
          ? "border-red-500 focus:ring-red-500"
          : "focus:ring-blue-600 border-gray-300 dark:border-gray-700"
      }`}
    />
  );
}
