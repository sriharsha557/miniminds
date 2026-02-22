/**
 * FilterContext - Provides filter state management for bundle filtering
 * 
 * This context manages the filter state (age ranges, skills, price) and
 * provides filtered bundle results. It implements the filtering logic
 * according to the requirements:
 * - Age filter: OR logic for multiple selections (Requirement 2.3)
 * - Skill filter: OR logic for multiple selections (Requirement 3.3)
 * - Cross-filter: AND logic between different filter types (Requirement 3.4)
 * - Price filter: Show only free bundles when enabled (Requirement 4.2)
 * 
 * Requirements: 2.2, 2.3, 3.2, 3.3, 3.4, 3.5, 4.2
 */

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Bundle, FilterState } from '../types/bundle';
import { useBundleData } from './BundleDataContext';

/**
 * Context value interface
 */
export interface FilterContextValue {
  /** Current filter state */
  filters: FilterState;
  
  /** Update the filter state */
  setFilters: (filters: FilterState) => void;
  
  /** Reset all filters to default (show all bundles) */
  resetFilters: () => void;
  
  /** Bundles filtered according to current filter state */
  filteredBundles: Bundle[];
}

/**
 * Default filter state - no filters applied, show all bundles
 */
const DEFAULT_FILTER_STATE: FilterState = {
  ageRanges: [],
  skills: [],
  showFreeOnly: false,
};

/**
 * Create the context with undefined default value
 */
const FilterContext = createContext<FilterContextValue | undefined>(undefined);

/**
 * Props for FilterProvider
 */
interface FilterProviderProps {
  children: ReactNode;
}

/**
 * Filters bundles according to the provided filter state
 * 
 * Filtering logic:
 * - Age filter: If any age ranges selected, bundle must match one (OR logic)
 * - Skill filter: If any skills selected, bundle must have at least one (OR logic)
 * - Cross-filter: Bundle must match ALL filter types that are active (AND logic)
 * - Price filter: If showFreeOnly is true, bundle must be free
 * 
 * Requirements: 2.2, 2.3, 3.2, 3.3, 3.4, 4.2
 * 
 * @param bundles - Array of all bundles to filter
 * @param filters - Current filter state
 * @returns Filtered array of bundles
 */
export function filterBundles(bundles: Bundle[], filters: FilterState): Bundle[] {
  return bundles.filter(bundle => {
    // Age filter: if any age ranges selected, bundle must match one (Requirement 2.2, 2.3)
    const ageMatch = filters.ageRanges.length === 0 || 
                     filters.ageRanges.includes(bundle.ageRange);
    
    // Skill filter: if any skills selected, bundle must have at least one (Requirement 3.2, 3.3)
    const skillMatch = filters.skills.length === 0 || 
                       filters.skills.some(skill => bundle.skills.includes(skill));
    
    // Price filter: if showFreeOnly is true, bundle must be free (Requirement 4.2)
    const priceMatch = !filters.showFreeOnly || bundle.isFree;
    
    // Cross-filter: bundle must match ALL active filters (Requirement 3.4)
    return ageMatch && skillMatch && priceMatch;
  });
}

/**
 * Provider component that manages filter state and provides filtered bundles
 * 
 * Features:
 * - Manages filter state (age ranges, skills, price)
 * - Computes filtered bundles based on current filters
 * - Provides reset function to clear all filters (Requirement 3.5)
 * - Uses memoization to avoid redundant filtering
 */
export function FilterProvider({ children }: FilterProviderProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const { bundles } = useBundleData();

  /**
   * Reset all filters to default state (Requirement 3.5)
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTER_STATE);
  }, []);

  /**
   * Compute filtered bundles based on current filter state
   * Memoized to avoid redundant filtering on every render
   */
  const filteredBundles = useMemo(() => {
    return filterBundles(bundles, filters);
  }, [bundles, filters]);

  const value: FilterContextValue = {
    filters,
    setFilters,
    resetFilters,
    filteredBundles,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

/**
 * Hook to access filter context
 * 
 * @throws {Error} If used outside of FilterProvider
 * @returns FilterContextValue
 */
export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  
  return context;
}
