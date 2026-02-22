# BundleDataContext

## Overview

The `BundleDataContext` provides bundle data to all components in the MiniMinds application. It handles fetching data from the static `bundles.json` file, manages loading and error states, and implements caching to avoid redundant network requests.

## Features

- **Automatic Data Fetching**: Fetches bundle data on mount
- **Caching**: Caches data in memory to avoid redundant requests (Requirement 9.5)
- **Error Handling**: Comprehensive error handling with user-friendly messages (Requirement 12.1)
- **Error Logging**: Logs all errors to console for debugging (Requirement 12.5)
- **Manual Refetch**: Provides `refetch()` function to manually reload data
- **Loading States**: Tracks loading state for UI feedback
- **Type Safety**: Full TypeScript support

## Usage

### Basic Setup

Wrap your application with the `BundleDataProvider`:

```tsx
import { BundleDataProvider } from './contexts';

function App() {
  return (
    <BundleDataProvider>
      <YourComponents />
    </BundleDataProvider>
  );
}
```

### Accessing Bundle Data

Use the `useBundleData` hook in any component:

```tsx
import { useBundleData } from './contexts';

function BundleList() {
  const { bundles, isLoading, error, refetch } = useBundleData();

  if (isLoading) {
    return <div>Loading bundles...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {bundles.map(bundle => (
        <BundleCard key={bundle.id} bundle={bundle} />
      ))}
    </div>
  );
}
```

## API

### BundleDataContextValue

```typescript
interface BundleDataContextValue {
  bundles: Bundle[];      // Array of all bundles
  isLoading: boolean;     // Whether data is currently being fetched
  error: Error | null;    // Error object if fetch failed, null otherwise
  refetch: () => Promise<void>;  // Function to manually refetch bundle data
}
```

### useBundleData()

Hook to access the bundle data context.

**Returns**: `BundleDataContextValue`

**Throws**: Error if used outside of `BundleDataProvider`

## Error Handling

The context handles three types of errors:

1. **Network Errors**: When fetch fails due to network issues
   - Message: "Network error: Unable to fetch bundle data. Please check your connection."

2. **HTTP Errors**: When the server returns a non-OK status
   - Message: "Failed to fetch bundles: {status} {statusText}"

3. **Data Validation Errors**: When the response doesn't match expected format
   - Message: "Invalid bundle data format: expected { bundles: Bundle[] }"

All errors are logged to the console with `console.error()` for debugging.

## Caching Behavior

- Data is cached in memory after the first successful fetch
- Subsequent renders will use cached data without making new requests
- The `refetch()` function bypasses the cache and forces a new fetch
- Cache is cleared when the provider unmounts

## Testing

The context includes comprehensive unit tests covering:

- Successful data fetching
- Network error handling
- HTTP error handling
- Invalid data format handling
- Caching behavior
- Manual refetch functionality
- Error logging

Run tests with:
```bash
npm test -- src/contexts/BundleDataContext.test.tsx
```

## Requirements Satisfied

- **Requirement 9.5**: Bundle data caching to avoid redundant requests
- **Requirement 12.1**: Error handling for bundle data fetch failures
- **Requirement 12.5**: Error logging to browser console for debugging


---

# FilterContext

## Overview

The `FilterContext` provides filter state management for bundle filtering. It manages the filter state (age ranges, skills, price) and provides filtered bundle results based on the current filters. The context implements the filtering logic according to the requirements with proper OR/AND logic.

## Features

- **Filter State Management**: Manages age range, skill, and price filters
- **Filtered Results**: Automatically computes filtered bundles based on current filters
- **OR Logic**: Multiple selections within a filter type use OR logic (Requirement 2.3, 3.3)
- **AND Logic**: Different filter types use AND logic (Requirement 3.4)
- **Reset Filters**: Provides function to clear all filters (Requirement 3.5)
- **Performance**: Uses memoization to avoid redundant filtering
- **Type Safety**: Full TypeScript support

## Usage

### Basic Setup

Wrap your application with both providers (FilterProvider depends on BundleDataProvider):

```tsx
import { BundleDataProvider, FilterProvider } from './contexts';

function App() {
  return (
    <BundleDataProvider>
      <FilterProvider>
        <YourComponents />
      </FilterProvider>
    </BundleDataProvider>
  );
}
```

### Accessing Filter State

Use the `useFilters` hook in any component:

```tsx
import { useFilters } from './contexts';

function FilterPanel() {
  const { filters, setFilters, resetFilters, filteredBundles } = useFilters();

  const handleAgeChange = (age: AgeRange) => {
    const newAges = filters.ageRanges.includes(age)
      ? filters.ageRanges.filter(a => a !== age)
      : [...filters.ageRanges, age];
    
    setFilters({ ...filters, ageRanges: newAges });
  };

  return (
    <div>
      <h3>Filters</h3>
      <button onClick={() => handleAgeChange('3-4')}>
        Age 3-4 {filters.ageRanges.includes('3-4') ? '✓' : ''}
      </button>
      <button onClick={resetFilters}>Clear All</button>
      <p>{filteredBundles.length} bundles found</p>
    </div>
  );
}
```

### Displaying Filtered Results

```tsx
import { useFilters } from './contexts';

function BundleGrid() {
  const { filteredBundles } = useFilters();

  return (
    <div className="grid">
      {filteredBundles.map(bundle => (
        <BundleCard key={bundle.id} bundle={bundle} />
      ))}
    </div>
  );
}
```

## API

### FilterContextValue

```typescript
interface FilterContextValue {
  filters: FilterState;           // Current filter state
  setFilters: (filters: FilterState) => void;  // Update filter state
  resetFilters: () => void;       // Reset all filters to default
  filteredBundles: Bundle[];      // Bundles filtered by current state
}
```

### FilterState

```typescript
interface FilterState {
  ageRanges: AgeRange[];   // Selected age ranges (empty = no filter)
  skills: Skill[];         // Selected skills (empty = no filter)
  showFreeOnly: boolean;   // Whether to show only free bundles
}
```

### useFilters()

Hook to access the filter context.

**Returns**: `FilterContextValue`

**Throws**: Error if used outside of `FilterProvider`

## Filtering Logic

The `filterBundles` function implements the following logic:

### Age Filter (Requirement 2.2, 2.3)
- If no age ranges selected: Show all bundles
- If one or more age ranges selected: Show bundles matching ANY selected age (OR logic)

### Skill Filter (Requirement 3.2, 3.3)
- If no skills selected: Show all bundles
- If one or more skills selected: Show bundles with AT LEAST ONE selected skill (OR logic)

### Price Filter (Requirement 4.2)
- If `showFreeOnly` is false: Show all bundles
- If `showFreeOnly` is true: Show only free bundles

### Cross-Filter Logic (Requirement 3.4)
- Bundles must match ALL active filter types (AND logic)
- Example: If age "3-4" AND skill "Alphabet" are selected, only bundles that are age 3-4 AND have Alphabet skill will be shown

### Examples

```typescript
// Show only age 3-4 bundles
{ ageRanges: ['3-4'], skills: [], showFreeOnly: false }

// Show bundles with Alphabet OR Numbers
{ ageRanges: [], skills: ['Alphabet', 'Numbers'], showFreeOnly: false }

// Show free bundles that are age 3-4 OR 4-5 AND have Alphabet skill
{ ageRanges: ['3-4', '4-5'], skills: ['Alphabet'], showFreeOnly: true }
```

## Testing

The context includes comprehensive unit tests covering:

- Filter state initialization
- Filter state updates
- Filter reset functionality
- Age filter with single and multiple selections
- Skill filter with single and multiple selections
- Price filter (free only)
- Cross-filter AND logic
- Edge cases (empty arrays, no matches, etc.)

Run tests with:
```bash
npm test -- src/contexts/FilterContext.test.tsx
```

## Requirements Satisfied

- **Requirement 2.2**: Age-based filtering
- **Requirement 2.3**: Multiple age range selection with OR logic
- **Requirement 3.2**: Skill-based filtering
- **Requirement 3.3**: Multiple skill selection with OR logic
- **Requirement 3.4**: Cross-filter AND logic (age AND skill)
- **Requirement 3.5**: Reset/clear all filters
- **Requirement 4.2**: Free-only bundle filtering

## Performance Considerations

- The `filteredBundles` array is memoized using `useMemo`
- Filtering only occurs when `bundles` or `filters` change
- The filtering algorithm is O(n) where n is the number of bundles
- For typical bundle counts (10-100), performance is excellent
