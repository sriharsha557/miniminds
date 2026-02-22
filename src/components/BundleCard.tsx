import type { KeyboardEvent, MouseEvent } from 'react';
import type { Bundle } from '../types/bundle';
import styles from './BundleCard.module.css';

/**
 * Props for the BundleCard component
 */
export interface BundleCardProps {
  /** The bundle to display */
  bundle: Bundle;
  /** Callback when the card is clicked */
  onClick: (bundleId: string) => void;
  /** Callback when add-to-cart is clicked for paid bundles */
  onAddToCart?: (bundle: Bundle) => void;
}

/**
 * BundleCard component displays a summary of a worksheet bundle
 *
 * Features:
 * - Display bundle name, age range, skills, worksheet count
 * - Show free/paid badge
 * - Display cover image with lazy loading
 * - Handle click to navigate to detail page
 * - Responsive layout (stacks vertically on mobile, horizontal on tablet+)
 *
 * Requirements: 1.1, 1.2, 9.4
 */
export function BundleCard({ bundle, onClick, onAddToCart }: BundleCardProps) {
  const handleClick = () => {
    onClick(bundle.id);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // Handle Enter and Space keys for keyboard accessibility
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(bundle.id);
    }
  };

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onAddToCart?.(bundle);
  };

  return (
    <article
      className={styles.card}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${bundle.name}`}
    >
      {/* Cover Image */}
      <div className={styles.imageContainer}>
        <img
          src={bundle.coverImageUrl}
          alt={`${bundle.name} cover`}
          className={styles.image}
          loading="lazy"
          width={400}
          height={300}
        />

        {/* Free/Paid Badge */}
        <div className={styles.badge} aria-label={bundle.isFree ? 'Free bundle' : 'Paid bundle'}>
          {bundle.isFree ? (
            <span className={styles.badgeFree}>Free</span>
          ) : (
            <span className={styles.badgePaid}>INR {bundle.price?.toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Bundle Information */}
      <div className={styles.content}>
        <h3 className={styles.title}>{bundle.name}</h3>

        <div className={styles.metadata}>
          {/* Age Range */}
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>Age:</span>
            <span className={styles.metadataValue}>{bundle.ageRange} years</span>
          </div>

          {/* Worksheet Count */}
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>Worksheets:</span>
            <span className={styles.metadataValue}>{bundle.worksheetCount}</span>
          </div>
        </div>

        {/* Skills */}
        <div className={styles.skills}>
          {bundle.skills.map((skill) => (
            <span key={skill} className={styles.skillTag}>
              {skill}
            </span>
          ))}
        </div>

        {!bundle.isFree && onAddToCart && (
          <button
            type="button"
            className={styles.addToCartButton}
            onClick={handleAddToCart}
            aria-label={`Add ${bundle.name} to cart`}
          >
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
}
