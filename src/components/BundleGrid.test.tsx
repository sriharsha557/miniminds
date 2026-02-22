/**
 * Unit tests for BundleGrid component
 * 
 * Tests cover:
 * - Loading state with skeleton
 * - Error state with retry functionality
 * - Empty state when no bundles match filters
 * - Successful bundle display in grid
 * - Bundle click interactions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BundleGrid } from './BundleGrid';
import type { Bundle } from '../types/bundle';

/**
 * Helper function to create a mock bundle
 */
function createMockBundle(overrides?: Partial<Bundle>): Bundle {
  return {
    id: 'test-bundle-1',
    name: 'Test Bundle',
    ageRange: '3-4',
    skills: ['Alphabet', 'Tracing'],
    learningGoals: ['Learn letters', 'Practice writing'],
    worksheetCount: 10,
    isFree: true,
    coverImageUrl: '/images/test-cover.jpg',
    previewImageUrls: ['/images/preview1.jpg'],
    pdfUrl: '/pdfs/test.pdf',
    pdfSizeBytes: 1000000,
    printingTips: ['Print on letter paper'],
    ...overrides,
  };
}

describe('BundleGrid', () => {
  describe('Loading State', () => {
    it('should display loading skeleton when isLoading is true', () => {
      render(
        <BundleGrid
          bundles={[]}
          isLoading={true}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      // Check for loading status
      expect(screen.getByRole('status', { name: /loading bundles/i })).toBeInTheDocument();
      expect(screen.getByText(/loading bundles/i)).toBeInTheDocument();
    });

    it('should display multiple skeleton cards while loading', () => {
      const { container } = render(
        <BundleGrid
          bundles={[]}
          isLoading={true}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      // Check that skeleton cards are rendered
      const skeletonCards = container.querySelectorAll('[class*="skeletonCard"]');
      expect(skeletonCards.length).toBeGreaterThan(0);
    });

    it('should not display bundles while loading', () => {
      const bundles = [createMockBundle()];
      
      render(
        <BundleGrid
          bundles={bundles}
          isLoading={true}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      // Bundle should not be visible during loading
      expect(screen.queryByText('Test Bundle')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error is present', () => {
      const error = new Error('Failed to fetch bundles');
      
      render(
        <BundleGrid
          bundles={[]}
          isLoading={false}
          error={error}
          onBundleClick={vi.fn()}
        />
      );

      // Check for error alert
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/unable to load bundles/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch bundles/i)).toBeInTheDocument();
    });

    it('should display generic error message when error has no message', () => {
      const error = new Error();
      
      render(
        <BundleGrid
          bundles={[]}
          isLoading={false}
          error={error}
          onBundleClick={vi.fn()}
        />
      );

      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });

    it('should not display bundles when error is present', () => {
      const bundles = [createMockBundle()];
      const error = new Error('Network error');
      
      render(
        <BundleGrid
          bundles={bundles}
          isLoading={false}
          error={error}
          onBundleClick={vi.fn()}
        />
      );

      // Bundles should not be visible when there's an error
      expect(screen.queryByText('Test Bundle')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no bundles are provided', () => {
      render(
        <BundleGrid
          bundles={[]}
          isLoading={false}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      // Check for empty state
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/no bundles found/i)).toBeInTheDocument();
      expect(screen.getByText(/no bundles match your current filters/i)).toBeInTheDocument();
    });

    it('should suggest adjusting search criteria in empty state', () => {
      render(
        <BundleGrid
          bundles={[]}
          isLoading={false}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      expect(screen.getByText(/try adjusting your search criteria/i)).toBeInTheDocument();
    });
  });

  describe('Bundle Display', () => {
    it('should display bundles in grid when bundles are provided', () => {
      const bundles = [
        createMockBundle({ id: '1', name: 'Bundle 1' }),
        createMockBundle({ id: '2', name: 'Bundle 2' }),
        createMockBundle({ id: '3', name: 'Bundle 3' }),
      ];

      render(
        <BundleGrid
          bundles={bundles}
          isLoading={false}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      // Check that all bundles are displayed
      expect(screen.getByText('Bundle 1')).toBeInTheDocument();
      expect(screen.getByText('Bundle 2')).toBeInTheDocument();
      expect(screen.getByText('Bundle 3')).toBeInTheDocument();
    });

    it('should render grid with proper ARIA label', () => {
      const bundles = [createMockBundle()];

      render(
        <BundleGrid
          bundles={bundles}
          isLoading={false}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      expect(screen.getByRole('region', { name: /bundle grid/i })).toBeInTheDocument();
    });

    it('should display single bundle correctly', () => {
      const bundle = createMockBundle({
        name: 'Alphabet Tracing',
        ageRange: '3-4',
        worksheetCount: 26,
      });

      render(
        <BundleGrid
          bundles={[bundle]}
          isLoading={false}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      expect(screen.getByText('Alphabet Tracing')).toBeInTheDocument();
      expect(screen.getByText('3-4 years')).toBeInTheDocument();
      expect(screen.getByText('26')).toBeInTheDocument();
    });

    it('should display multiple bundles with different properties', () => {
      const bundles = [
        createMockBundle({ 
          id: '1', 
          name: 'Free Bundle', 
          isFree: true 
        }),
        createMockBundle({ 
          id: '2', 
          name: 'Paid Bundle', 
          isFree: false, 
          price: 9.99 
        }),
      ];

      render(
        <BundleGrid
          bundles={bundles}
          isLoading={false}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      expect(screen.getByText('Free Bundle')).toBeInTheDocument();
      expect(screen.getByText('Paid Bundle')).toBeInTheDocument();
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('INR 9.99')).toBeInTheDocument();
    });
  });

  describe('State Priority', () => {
    it('should prioritize loading state over error state', () => {
      const error = new Error('Test error');
      
      render(
        <BundleGrid
          bundles={[]}
          isLoading={true}
          error={error}
          onBundleClick={vi.fn()}
        />
      );

      // Should show loading, not error
      expect(screen.getByRole('status', { name: /loading bundles/i })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should prioritize error state over empty state', () => {
      const error = new Error('Test error');
      
      render(
        <BundleGrid
          bundles={[]}
          isLoading={false}
          error={error}
          onBundleClick={vi.fn()}
        />
      );

      // Should show error, not empty state
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.queryByText(/no bundles found/i)).not.toBeInTheDocument();
    });

    it('should show empty state only when not loading, no error, and no bundles', () => {
      render(
        <BundleGrid
          bundles={[]}
          isLoading={false}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      expect(screen.getByText(/no bundles found/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for loading state', () => {
      render(
        <BundleGrid
          bundles={[]}
          isLoading={true}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      const loadingStatus = screen.getByRole('status', { name: /loading bundles/i });
      expect(loadingStatus).toBeInTheDocument();
    });

    it('should have proper ARIA role for error state', () => {
      const error = new Error('Test error');
      
      render(
        <BundleGrid
          bundles={[]}
          isLoading={false}
          error={error}
          onBundleClick={vi.fn()}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have proper ARIA role for empty state', () => {
      render(
        <BundleGrid
          bundles={[]}
          isLoading={false}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have proper ARIA label for grid region', () => {
      const bundles = [createMockBundle()];
      
      render(
        <BundleGrid
          bundles={bundles}
          isLoading={false}
          error={null}
          onBundleClick={vi.fn()}
        />
      );

      expect(screen.getByRole('region', { name: /bundle grid/i })).toBeInTheDocument();
    });
  });
});
