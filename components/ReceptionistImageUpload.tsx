"use client";

type ReceptionistImageUploadProps = {
  disabled?: boolean;
  initialImageUrl?: string;
  error?: string;
};

export default function ReceptionistImageUpload({
  disabled = false,
  initialImageUrl,
  error,
}: ReceptionistImageUploadProps) {
  return (
    <div className="w-full max-w-44 space-y-3">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        {initialImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={initialImageUrl}
            alt="Receptionist profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-4xl text-gray-400">
            account_circle
          </span>
        )}
      </div>
      <input
        type="url"
        name="profileImage"
        disabled={disabled}
        defaultValue={initialImageUrl}
        placeholder="Image URL"
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
