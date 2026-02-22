/**
 * Unit tests for FilterContext
 * 
 * Tests filter logic, state management, and context functionality
 * Requirements: 2.2, 2.3, 3.2, 3.3, 3.4, 3.5, 4.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FilterProvider, useFilters, filterBundles } from './FilterContext';
import { BundleDataProvider } from './BundleDataContext';
import type { Bundle, FilterState } from '../types/bundle';

// Test component that uses the filter context
function TestConsumer() {
  const { filters, setFilters, resetFilters, filteredBundles } = useFilters();
  
  return (
    <div>
      <div data-testid="age-ranges">{filters.ageRanges.join(',')}</div>
      <div data-testid="skills">{filters.skills.join(',')}</div>
      <div data-testid="show-free-only">{filters.showFreeOnly ? 'true' : 'false'}</div>
      <div data-testid="filtered-count">{filteredBundles.length}</div>
      <button onClick={() => setFilters({ ageRanges: ['3-4'], skills: [], showFreeOnly: false })}>
        Set Age Filter
      </button>
      <button onClick={() => setFilters({ ageRanges: [], skills: ['Alphabet'], showFreeOnly: false })}>
        Set Skill Filter
      </button>
      <button onClick={() => setFilters({ ageRanges: [], skills: [], showFreeOnly: true })}>
        Set Free Only
      </button>
      <button onClick={resetFilters}>Reset Filters</button>
    </div>
  );
}

// Mock bundle data for testing
const mockBundles: Bundle[] = [
  {
    id: 'bundle-1',
    name: 'Alphabet Tracing',
    ageRange: '3-4',
    skills: ['Alphabet', 'Tracing'],
    learningGoals: ['Learn letters'],
    worksheetCount: 10,
    isFree: true,
    coverImageUrl: '/test1.jpg',
    previewImageUrls: ['/preview1.jpg'],
    pdfUrl: '/test1.pdf',
    pdfSizeBytes: 1000000,
    printingTips: ['Print on letter paper'],
  },
  {
    id: 'bundle-2',
    name: 'Numbers Practice',
    ageRange: '4-5',
    skills: ['Numbers'],
    learningGoals: ['Learn counting'],
    worksheetCount: 15,
    isFree: false,
    price: 9.99,
    coverImageUrl: '/test2.jpg',
    previewImageUrls: ['/preview2.jpg'],
    pdfUrl: '/test2.pdf',
    pdfSizeBytes: 2000000,
    printingTips: ['Print on A4 paper'],
  },
  {
    id: 'bundle-3',
    name: 'Shapes and Colors',
    ageRange: '2-3',
    skills: ['Shapes/Colors'],
    learningGoals: ['Recognize shapes'],
    worksheetCount: 12,
    isFree: true,
    coverImageUrl: '/test3.jpg',
    previewImageUrls: ['/preview3.jpg'],
    pdfUrl: '/test3.pdf',
    pdfSizeBytes: 1500000,
    printingTips: ['Use color printer'],
  },
  {
    id: 'bundle-4',
    name: 'Advanced Alphabet',
    ageRange: '5-6',
    skills: ['Alphabet', 'Logical Thinking'],
    learningGoals: ['Master letters'],
    worksheetCount: 20,
    isFree: false,
    price: 14.99,
    coverImageUrl: '/test4.jpg',
    previewImageUrls: ['/preview4.jpg'],
    pdfUrl: '/test4.pdf',
    pdfSizeBytes: 3000000,
    printingTips: ['Print double-sided'],
  },
];

describe('FilterContext', () => {
  beforeEach(() => {
    // Mock fetch to return our test bundles
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bundles: mockBundles }),
    });
  });

  it('should throw error when useFilters is used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useFilters must be used within a FilterProvider');
    
    consoleError.mockRestore();
  });

  it('should initialize with default filter state (no filters)', async () => {
    render(
      <BundleDataProvider>
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      </BundleDataProvider>
    );

    // Wait for bundles to load
    await vi.waitFor(() => {
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('4');
    });

    // Should have no filters applied
    expect(screen.getByTestId('age-ranges')).toHaveTextContent('');
    expect(screen.getByTestId('skills')).toHaveTextContent('');
    expect(screen.getByTestId('show-free-only')).toHaveTextContent('false');
    
    // Should show all bundles
    expect(screen.getByTestId('filtered-count')).toHaveTextContent('4');
  });

  it('should update filter state when setFilters is called', async () => {
    render(
      <BundleDataProvider>
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      </BundleDataProvider>
    );

    // Wait for bundles to load
    await vi.waitFor(() => {
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('4');
    });

    // Click button to set age filter
    act(() => {
      screen.getByText('Set Age Filter').click();
    });

    // Filter state should be updated
    expect(screen.getByTestId('age-ranges')).toHaveTextContent('3-4');
    expect(screen.getByTestId('filtered-count')).toHaveTextContent('1');
  });

  it('should reset filters when resetFilters is called', async () => {
    render(
      <BundleDataProvider>
        <FilterProvider>
          <TestConsumer />
        </FilterProvider>
      </BundleDataProvider>
    );

    // Wait for bundles to load
    await vi.waitFor(() => {
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('4');
    });

    // Set a filter
    act(() => {
      screen.getByText('Set Age Filter').click();
    });

    expect(screen.getByTestId('filtered-count')).toHaveTextContent('1');

    // Reset filters
    act(() => {
      screen.getByText('Reset Filters').click();
    });

    // Should be back to default state
    expect(screen.getByTestId('age-ranges')).toHaveTextContent('');
    expect(screen.getByTestId('skills')).toHaveTextContent('');
    expect(screen.getByTestId('show-free-only')).toHaveTextContent('false');
    expect(screen.getByTestId('filtered-count')).toHaveTextContent('4');
  });
});

describe('filterBundles function', () => {
  it('should return all bundles when no filters are applied', () => {
    const filters: FilterState = {
      ageRanges: [],
      skills: [],
      showFreeOnly: false,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(4);
    expect(result).toEqual(mockBundles);
  });

  it('should filter by single age range (Requirement 2.2)', () => {
    const filters: FilterState = {
      ageRanges: ['3-4'],
      skills: [],
      showFreeOnly: false,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bundle-1');
    expect(result[0].ageRange).toBe('3-4');
  });

  it('should filter by multiple age ranges with OR logic (Requirement 2.3)', () => {
    const filters: FilterState = {
      ageRanges: ['3-4', '4-5'],
      skills: [],
      showFreeOnly: false,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(2);
    expect(result.map(b => b.id)).toContain('bundle-1');
    expect(result.map(b => b.id)).toContain('bundle-2');
  });

  it('should filter by single skill (Requirement 3.2)', () => {
    const filters: FilterState = {
      ageRanges: [],
      skills: ['Numbers'],
      showFreeOnly: false,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bundle-2');
    expect(result[0].skills).toContain('Numbers');
  });

  it('should filter by multiple skills with OR logic (Requirement 3.3)', () => {
    const filters: FilterState = {
      ageRanges: [],
      skills: ['Alphabet', 'Numbers'],
      showFreeOnly: false,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(3);
    // Should include bundles with Alphabet OR Numbers
    expect(result.map(b => b.id)).toContain('bundle-1'); // Has Alphabet
    expect(result.map(b => b.id)).toContain('bundle-2'); // Has Numbers
    expect(result.map(b => b.id)).toContain('bundle-4'); // Has Alphabet
  });

  it('should match bundles with at least one of the selected skills', () => {
    const filters: FilterState = {
      ageRanges: [],
      skills: ['Tracing'],
      showFreeOnly: false,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bundle-1');
    expect(result[0].skills).toContain('Tracing');
  });

  it('should apply AND logic between age and skill filters (Requirement 3.4)', () => {
    const filters: FilterState = {
      ageRanges: ['3-4', '5-6'],
      skills: ['Alphabet'],
      showFreeOnly: false,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(2);
    // Should include bundles that match (age 3-4 OR 5-6) AND have Alphabet skill
    expect(result.map(b => b.id)).toContain('bundle-1'); // 3-4, Alphabet
    expect(result.map(b => b.id)).toContain('bundle-4'); // 5-6, Alphabet
  });

  it('should filter by free only (Requirement 4.2)', () => {
    const filters: FilterState = {
      ageRanges: [],
      skills: [],
      showFreeOnly: true,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(2);
    expect(result.every(b => b.isFree)).toBe(true);
    expect(result.map(b => b.id)).toContain('bundle-1');
    expect(result.map(b => b.id)).toContain('bundle-3');
  });

  it('should apply AND logic between all filter types', () => {
    const filters: FilterState = {
      ageRanges: ['3-4'],
      skills: ['Alphabet'],
      showFreeOnly: true,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bundle-1');
    expect(result[0].ageRange).toBe('3-4');
    expect(result[0].skills).toContain('Alphabet');
    expect(result[0].isFree).toBe(true);
  });

  it('should return empty array when no bundles match filters', () => {
    const filters: FilterState = {
      ageRanges: ['2-3'],
      skills: ['Numbers'],
      showFreeOnly: false,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(0);
  });

  it('should handle empty bundle array', () => {
    const filters: FilterState = {
      ageRanges: ['3-4'],
      skills: [],
      showFreeOnly: false,
    };

    const result = filterBundles([], filters);
    expect(result).toHaveLength(0);
  });

  it('should not mutate the original bundles array', () => {
    const originalBundles = [...mockBundles];
    const filters: FilterState = {
      ageRanges: ['3-4'],
      skills: [],
      showFreeOnly: false,
    };

    filterBundles(mockBundles, filters);
    
    expect(mockBundles).toEqual(originalBundles);
  });

  it('should handle bundles with multiple skills correctly', () => {
    const filters: FilterState = {
      ageRanges: [],
      skills: ['Logical Thinking'],
      showFreeOnly: false,
    };

    const result = filterBundles(mockBundles, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bundle-4');
    expect(result[0].skills).toContain('Logical Thinking');
  });

  it('should include paid bundles when showFreeOnly is false', () => {
    const filters: FilterState = {
      ageRanges: [],
      skills: [],
      showFreeOnly: false,
    };

    const result = filterBundles(mockBundles, filters);
    const paidBundles = result.filter(b => !b.isFree);
    expect(paidBundles.length).toBeGreaterThan(0);
  });

  it('should exclude paid bundles when showFreeOnly is true', () => {
    const filters: FilterState = {
      ageRanges: [],
      skills: [],
      showFreeOnly: true,
    };

    const result = filterBundles(mockBundles, filters);
    const paidBundles = result.filter(b => !b.isFree);
    expect(paidBundles).toHaveLength(0);
  });
});
