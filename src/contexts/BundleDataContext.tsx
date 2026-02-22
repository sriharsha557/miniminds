/**
 * BundleDataContext - Provides bundle data to all components
 * 
 * This context handles fetching bundle data from the static JSON file,
 * manages loading and error states, and provides caching to avoid
 * redundant network requests.
 * 
 * Requirements: 9.5 (caching), 12.1 (error handling)
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Bundle } from '../types/bundle';

/**
 * Context value interface
 */
export interface BundleDataContextValue {
  /** Array of all bundles */
  bundles: Bundle[];
  
  /** Whether data is currently being fetched */
  isLoading: boolean;
  
  /** Error object if fetch failed, null otherwise */
  error: Error | null;
  
  /** Function to manually refetch bundle data */
  refetch: () => Promise<void>;
}

/**
 * Create the context with undefined default value
 */
const BundleDataContext = createContext<BundleDataContextValue | undefined>(undefined);

/**
 * Props for BundleDataProvider
 */
interface BundleDataProviderProps {
  children: ReactNode;
}

/**
 * Fetches bundle data from the static JSON file
 * 
 * @throws {Error} If the fetch fails or response is not ok
 * @returns Promise resolving to array of bundles
 */
async function fetchBundles(): Promise<Bundle[]> {
  try {
    const response = await fetch('/bundles.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bundles: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate that we have a bundles array
    if (!data || !Array.isArray(data.bundles)) {
      throw new Error('Invalid bundle data format: expected { bundles: Bundle[] }');
    }
    
    return data.bundles;
  } catch (error) {
    // Re-throw with more context if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to fetch bundle data. Please check your connection.');
    }
    
    // Re-throw other errors as-is
    throw error;
  }
}

/**
 * Provider component that fetches and provides bundle data
 * 
 * Features:
 * - Fetches bundle data on mount
 * - Caches data in memory to avoid redundant requests (Requirement 9.5)
 * - Provides loading and error states
 * - Logs errors to console for debugging (Requirement 12.5)
 * - Allows manual refetch via refetch function
 */
export function BundleDataProvider({ children }: BundleDataProviderProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  /**
   * Fetch bundle data with error handling
   */
  const loadBundles = useCallback(async () => {
    // If we've already fetched successfully, use cached data (Requirement 9.5)
    if (hasFetched && bundles.length > 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedBundles = await fetchBundles();
      setBundles(fetchedBundles);
      setHasFetched(true);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(errorObj);
      
      // Log error to console for debugging (Requirement 12.5)
      console.error('Bundle fetch error:', errorObj);
    } finally {
      setIsLoading(false);
    }
  }, [hasFetched, bundles.length]);

  /**
   * Manual refetch function that bypasses cache
   */
  const refetch = useCallback(async () => {
    setHasFetched(false);
    setIsLoading(true);
    setError(null);

    try {
      const fetchedBundles = await fetchBundles();
      setBundles(fetchedBundles);
      setHasFetched(true);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(errorObj);
      
      // Log error to console for debugging (Requirement 12.5)
      console.error('Bundle refetch error:', errorObj);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch bundles on mount
  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  const value: BundleDataContextValue = {
    bundles,
    isLoading,
    error,
    refetch,
  };

  return (
    <BundleDataContext.Provider value={value}>
      {children}
    </BundleDataContext.Provider>
  );
}

/**
 * Hook to access bundle data context
 * 
 * @throws {Error} If used outside of BundleDataProvider
 * @returns BundleDataContextValue
 */
export function useBundleData(): BundleDataContextValue {
  const context = useContext(BundleDataContext);
  
  if (context === undefined) {
    throw new Error('useBundleData must be used within a BundleDataProvider');
  }
  
  return context;
}
