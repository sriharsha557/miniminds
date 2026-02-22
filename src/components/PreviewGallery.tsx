import { useEffect, useState } from 'react';
import styles from './PreviewGallery.module.css';

export interface PreviewGalleryProps {
  images: string[];
  bundleName: string;
}

export function PreviewGallery({ images, bundleName }: PreviewGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null);
      } else if (event.key === 'ArrowRight') {
        setActiveIndex((previous) => {
          if (previous === null) {
            return 0;
          }
          return (previous + 1) % images.length;
        });
      } else if (event.key === 'ArrowLeft') {
        setActiveIndex((previous) => {
          if (previous === null) {
            return 0;
          }
          return (previous - 1 + images.length) % images.length;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, images.length]);

  if (images.length === 0) {
    return (
      <div className={styles.empty}>
        Preview images are not available for this bundle yet.
      </div>
    );
  }

  return (
    <>
      <div className={styles.grid}>
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            className={styles.thumbButton}
            onClick={() => setActiveIndex(index)}
            aria-label={`Open preview ${index + 1} for ${bundleName}`}
          >
            <img src={src} alt={`${bundleName} preview ${index + 1}`} loading="lazy" className={styles.thumb} />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Preview image viewer">
          <button
            type="button"
            className={styles.close}
            onClick={() => setActiveIndex(null)}
            aria-label="Close preview"
          >
            Close
          </button>
          <img
            className={styles.lightboxImage}
            src={images[activeIndex]}
            alt={`${bundleName} preview ${activeIndex + 1}`}
          />
        </div>
      )}
    </>
  );
}
