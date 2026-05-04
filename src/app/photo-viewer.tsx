"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type PhotoViewerProps = {
  animalName: string;
  photos: string[];
};

export function PhotoViewer({ animalName, photos }: PhotoViewerProps) {
  const uniquePhotos = useMemo(() => Array.from(new Set(photos.filter(Boolean))), [photos]);
  const [activePhoto, setActivePhoto] = useState(uniquePhotos[0]);

  if (!uniquePhotos.length) {
    return (
      <div className="photo-viewer empty-photo">
        <span>No photos added</span>
      </div>
    );
  }

  const currentPhoto = uniquePhotos.includes(activePhoto) ? activePhoto : uniquePhotos[0];

  return (
    <div className="photo-viewer">
      <div className="photo-stage">
        <Image src={currentPhoto} alt={`${animalName} profile photo`} fill sizes="(max-width: 900px) 100vw, 55vw" unoptimized />
      </div>
      {uniquePhotos.length > 1 ? (
        <div className="photo-thumbs" aria-label={`${animalName} photos`}>
          {uniquePhotos.map((photo, index) => (
            <button
              type="button"
              key={photo}
              className={photo === currentPhoto ? "active" : ""}
              onClick={() => setActivePhoto(photo)}
              aria-label={`View photo ${index + 1}`}
            >
              <Image src={photo} alt="" fill sizes="96px" unoptimized />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
