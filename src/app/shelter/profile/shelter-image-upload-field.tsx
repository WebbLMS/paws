"use client";

/* eslint-disable @next/next/no-img-element -- Blob previews cannot be rendered through next/image. */

import { useMemo, useRef, useState } from "react";

type ShelterImageUploadFieldProps = {
  name: string;
  existingName: string;
  label: string;
  help: string;
  initialUrl?: string | null;
  variant?: "cover" | "logo";
};

export function ShelterImageUploadField({
  name,
  existingName,
  label,
  help,
  initialUrl,
  variant = "cover",
}: ShelterImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [existingUrl, setExistingUrl] = useState(initialUrl ?? "");
  const [previewUrl, setPreviewUrl] = useState("");

  const imageUrl = previewUrl || existingUrl;
  const hasImage = Boolean(imageUrl);
  const imageLabel = useMemo(() => (previewUrl ? "New image selected" : existingUrl ? "Current image" : "No image yet"), [existingUrl, previewUrl]);

  function chooseFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setExistingUrl("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className={`shelter-image-upload ${variant}`}>
      <input type="hidden" name={existingName} value={existingUrl} />
      <div className="shelter-image-preview">
        {hasImage ? <img src={imageUrl} alt="" /> : <span>{variant === "logo" ? "Logo" : "Cover"}</span>}
      </div>
      <div className="shelter-image-copy">
        <span>{label}</span>
        <strong>{imageLabel}</strong>
        <p>{help}</p>
      </div>
      <div className="shelter-image-actions">
        <label>
          Upload
          <input
            ref={inputRef}
            name={name}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => chooseFile(event.currentTarget.files?.[0])}
          />
        </label>
        {hasImage ? (
          <button type="button" onClick={removeImage}>
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
