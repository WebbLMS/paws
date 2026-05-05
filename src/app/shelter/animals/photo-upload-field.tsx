"use client";

import { useMemo, useRef, useState } from "react";

type ExistingPhoto = {
  url: string;
  isPrimary?: boolean;
};

type PendingPhoto = {
  file: File;
  previewUrl: string;
};

type PhotoUploadFieldProps = {
  existingPhotos?: ExistingPhoto[];
};

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function syncInputFiles(input: HTMLInputElement | null, photos: PendingPhoto[]) {
  if (!input) return;

  const dataTransfer = new DataTransfer();
  for (const photo of photos) {
    dataTransfer.items.add(photo.file);
  }
  input.files = dataTransfer.files;
}

export function PhotoUploadField({ existingPhotos = [] }: PhotoUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [keptExistingPhotos, setKeptExistingPhotos] = useState(existingPhotos);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [primaryPhotoKey, setPrimaryPhotoKey] = useState(() => {
    const primaryPhoto = existingPhotos.find((photo) => photo.isPrimary) ?? existingPhotos[0];
    return primaryPhoto ? `existing:${primaryPhoto.url}` : "";
  });

  const visiblePhotos = useMemo(
    () => [
      ...keptExistingPhotos.map((photo) => ({
        key: `existing:${photo.url}`,
        url: photo.url,
        label: "Saved photo",
      })),
      ...pendingPhotos.map((photo, index) => ({
        key: `new:${index}`,
        url: photo.previewUrl,
        label: photo.file.name,
      })),
    ],
    [keptExistingPhotos, pendingPhotos],
  );

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const imageFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) return;

    setPendingPhotos((current) => {
      const currentKeys = new Set(current.map((photo) => fileKey(photo.file)));
      const next = [
        ...current,
        ...imageFiles
          .filter((file) => !currentKeys.has(fileKey(file)))
          .map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
          })),
      ].slice(0, 12);

      syncInputFiles(fileInputRef.current, next);

      if (!primaryPhotoKey && !keptExistingPhotos.length && next.length) {
        setPrimaryPhotoKey("new:0");
      }

      return next;
    });
  }

  function removeExistingPhoto(url: string) {
    setKeptExistingPhotos((current) => {
      const next = current.filter((photo) => photo.url !== url);
      if (primaryPhotoKey === `existing:${url}`) {
        const fallbackExisting = next[0]?.url;
        setPrimaryPhotoKey(fallbackExisting ? `existing:${fallbackExisting}` : pendingPhotos.length ? "new:0" : "");
      }
      return next;
    });
  }

  function removePendingPhoto(index: number) {
    setPendingPhotos((current) => {
      URL.revokeObjectURL(current[index]?.previewUrl ?? "");
      const next = current.filter((_, photoIndex) => photoIndex !== index);
      syncInputFiles(fileInputRef.current, next);

      if (primaryPhotoKey === `new:${index}` || primaryPhotoKey.startsWith("new:")) {
        const fallbackExisting = keptExistingPhotos[0]?.url;
        setPrimaryPhotoKey(fallbackExisting ? `existing:${fallbackExisting}` : next.length ? "new:0" : "");
      }

      return next;
    });
  }

  return (
    <section className="photo-upload-field" aria-label="Animal photos">
      {keptExistingPhotos.map((photo) => (
        <input type="hidden" name="existingPhotoUrls" value={photo.url} key={photo.url} />
      ))}
      <input type="hidden" name="primaryPhotoKey" value={primaryPhotoKey} />

      <div className="photo-upload-toolbar">
        <div>
          <strong>{visiblePhotos.length} photo{visiblePhotos.length === 1 ? "" : "s"}</strong>
          <span>{primaryPhotoKey ? "Primary selected" : "Add a primary photo before publishing"}</span>
        </div>
        <div
          className={`photo-drop-zone ${isDragging ? "dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            name="animalPhotos"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            onChange={(event) => addFiles(event.currentTarget.files)}
          />
          <div>
            <strong>Add photos</strong>
            <span>Drop files or click to upload</span>
          </div>
        </div>
      </div>

      {visiblePhotos.length ? (
        <div className="photo-upload-grid">
          {visiblePhotos.map((photo, index) => {
            const isPending = photo.key.startsWith("new:");
            const pendingIndex = isPending ? Number.parseInt(photo.key.slice("new:".length), 10) : -1;
            const existingUrl = photo.key.startsWith("existing:") ? photo.key.slice("existing:".length) : "";

            return (
              <article className={primaryPhotoKey === photo.key ? "primary" : ""} key={`${photo.key}-${index}`}>
                <button
                  className="photo-upload-preview"
                  type="button"
                  style={{ backgroundImage: `url(${photo.url})` }}
                  onClick={() => setPrimaryPhotoKey(photo.key)}
                  aria-label={`Set ${photo.label} as primary photo`}
                />
                <div>
                  <button type="button" className="primary-toggle" onClick={() => setPrimaryPhotoKey(photo.key)}>
                    {primaryPhotoKey === photo.key ? "Primary" : "Set Primary"}
                  </button>
                  <button
                    type="button"
                    className="remove-photo"
                    onClick={() => (isPending ? removePendingPhoto(pendingIndex) : removeExistingPhoto(existingUrl))}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="photo-upload-empty">No photos added yet. The first uploaded image becomes the public profile photo.</p>
      )}
    </section>
  );
}
