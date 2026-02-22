/**
 * BundleGrid Component
 *
 * Displays bundles in a responsive grid layout with loading and error states.
 *
 * Features:
 * - Responsive grid (1 column mobile, 2 tablet, 3-4 desktop)
 * - Loading skeleton during data fetch
 * - Error message on fetch failure
 * - EmptyState when no bundles match filters
 * - Default bundle ordering
 *
 * Requirements: 1.3, 10.1, 10.3, 12.1
 */

import { BundleCard } from './BundleCard';
import type { Bundle } from '../types/bundle';
import styles from './BundleGrid.module.css';

/**
 * Props for the BundleGrid component
 */
export interface BundleGridProps {
  /** Array of bundles to display */
  bundles: Bundle[];

  /** Whether data is currently being loaded */
  isLoading: boolean;

  /** Error object if data fetch failed, null otherwise */
  error: Error | null;

  /** Callback when a bundle card is clicked */
  onBundleClick: (bundleId: string) => void;
  /** Optional callback for adding paid bundles to cart */
  onAddToCart?: (bundle: Bundle) => void;
}

/**
 * Loading skeleton component for grid
 */
function LoadingSkeleton() {
  // Show 6 skeleton cards while loading
  const skeletonCount = 6;

  return (
    <div className={styles.grid} role="status" aria-label="Loading bundles">
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <div key={index} className={styles.skeletonCard} aria-hidden="true">
          <div className={styles.skeletonImage} />
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonText} />
            <div className={styles.skeletonText} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading bundles...</span>
    </div>
  );
}

/**
 * Error message component
 */
function ErrorMessage({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className={styles.errorContainer} role="alert">
      <div className={styles.errorIcon} aria-hidden="true">!</div>
      <h2 className={styles.errorTitle}>Unable to Load Bundles</h2>
      <p className={styles.errorMessage}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry} aria-label="Retry loading bundles">
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Empty state component when no bundles match filters
 */
function EmptyState() {
  return (
    <div className={styles.emptyContainer} role="status">
      <div className={styles.emptyIcon} aria-hidden="true">?</div>
      <h2 className={styles.emptyTitle}>No Bundles Found</h2>
      <p className={styles.emptyMessage}>
        No bundles match your current filters. Try adjusting your search criteria to see more results.
      </p>
    </div>
  );
}

/**
 * BundleGrid component
 *
 * Displays bundles in a responsive grid layout with proper handling of
 * loading, error, and empty states.
 *
 * Requirements:
 * - 1.3: Display bundles in grid layout with consistent formatting
 * - 10.1: Display bundles in logical default order
 * - 10.3: Display helpful message when filters result in no matches
 * - 12.1: Display user-friendly error message when bundle data fails to load
 */
export function BundleGrid({ bundles, isLoading, error, onBundleClick, onAddToCart }: BundleGridProps) {
  // Show loading skeleton while fetching data
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Show error message if fetch failed
  if (error) {
    return <ErrorMessage error={error} />;
  }

  // Show empty state if no bundles match filters
  if (bundles.length === 0) {
    return <EmptyState />;
  }

  // Display bundles in grid
  return (
    <div className={styles.grid} role="region" aria-label="Bundle grid">
      {bundles.map((bundle) => (
        <BundleCard key={bundle.id} bundle={bundle} onClick={onBundleClick} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
