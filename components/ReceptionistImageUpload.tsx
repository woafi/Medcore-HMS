"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_KEY;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function ReceptionistImageUpload({
  name = "profileImage",
  disabled = false,
  initialImageUrl = "",
  error = "",
}: {
  name?: string;
  disabled?: boolean;
  initialImageUrl?: string;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [status, setStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Please upload a JPG, PNG, GIF, or WEBP image.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Image must be 2MB or smaller.";
    }

    return "";
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      event.target.value = "";
      return;
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setUploadError(
        "Cloudinary upload is not configured. Add NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to .env."
      );
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "hospital-management-system/receptionists");

    setIsUploading(true);
    setStatus("Uploading photo...");
    setUploadError("");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const result = await response.json();

      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || "Cloudinary upload failed.");
      }

      setImageUrl(result.secure_url);
      setStatus("Photo uploaded successfully.");
    } catch (uploadFailedError) {
      setUploadError(uploadFailedError instanceof Error ? uploadFailedError.message : String(uploadFailedError));
      setStatus("");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleRemove = () => {
    setImageUrl("");
    setStatus("");
    setUploadError("");
  };

  const helperMessage = uploadError || error || status;

  return (
    <div className="w-full max-w-[180px] flex-shrink-0">
      <input type="hidden" name={name} value={imageUrl} />
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_FILE_TYPES.join(",")}
        className="sr-only"
        disabled={disabled || isUploading}
        onChange={handleUpload}
      />

      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        className="relative flex h-36 w-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-500 dark:hover:border-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Uploaded receptionist profile"
            fill
            sizes="144px"
            className="object-cover"
          />
        ) : isUploading ? (
          <>
            <Loader2 className="mb-2 h-8 w-8 animate-spin" />
            <span className="px-3 text-center text-[11px] font-bold uppercase tracking-[0.2em]">
              Uploading
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="mb-2 h-8 w-8" />
            <span className="px-3 text-center text-[11px] font-bold uppercase tracking-[0.2em]">
              Upload Photo
            </span>
          </>
        )}
      </button>

      {imageUrl ? (
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={handleRemove}
          className="mt-3 inline-flex w-36 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </button>
      ) : (
        <p className="mt-3 w-36 text-center text-xs text-gray-400 dark:text-gray-500">
          JPG, PNG, GIF or WEBP. Max 2MB.
        </p>
      )}

      {helperMessage ? (
        <p
          className={`mt-2 w-36 text-center text-xs ${
            uploadError || error
              ? "text-red-500"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {helperMessage}
        </p>
      ) : null}
    </div>
  );
}
