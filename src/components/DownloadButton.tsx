import { useState } from 'react';
import type { Bundle } from '../types/bundle';
import { formatFileSize } from '../utils/download';
import styles from './DownloadButton.module.css';

export interface DownloadButtonProps {
  bundle: Bundle;
  onRequestDownload: () => Promise<void> | void;
  onRequestPurchase?: () => void;
  onAddToCart?: () => void;
  isInCart?: boolean;
}

export function DownloadButton({
  bundle,
  onRequestDownload,
  onRequestPurchase,
  onAddToCart,
  isInCart = false,
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onRequestDownload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start download.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!bundle.isFree) {
    return (
      <div className={styles.purchaseCard}>
        <p className={styles.purchasePrice}>Price: INR {bundle.price?.toFixed(2)}</p>
        <p className={styles.purchaseHint}>Unlock instant access with secure checkout.</p>
        <div className={styles.purchaseActions}>
          <button type="button" className={styles.secondaryButton} onClick={onAddToCart} disabled={isInCart}>
            {isInCart ? 'Added to Cart' : 'Add to Cart'}
          </button>
          <button type="button" className={styles.button} onClick={onRequestPurchase}>
            Buy Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.button}
        type="button"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? 'Preparing download...' : 'Download PDF'}
      </button>
      <p className={styles.meta}>File size: {formatFileSize(bundle.pdfSizeBytes)}</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
