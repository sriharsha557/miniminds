/**
 * HomePage Component Tests
 * 
 * Tests for the HomePage component including:
 * - Integration with FilterPanel and BundleGrid
 * - Context connections
 * - Scroll position restoration
 * 
 * Requirements: 2.4, 10.2, 11.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { FilterProvider } from '../contexts/FilterContext';
import { BundleDataProvider } from '../contexts/BundleDataContext';
import { CartProvider } from '../contexts/CartContext';
import type { Bundle } from '../types/bundle';

/**
 * Helper function to create a mock bundle
 */
function createMockBundle(overrides: Partial<Bundle> = {}): Bundle {
  return {
    id: 'test-bundle-1',
    name: 'Test Bundle',
    ageRange: '3-4',
    skills: ['Alphabet'],
    learningGoals: ['Learn letters'],
    worksheetCount: 10,
    isFree: true,
    coverImageUrl: '/images/test.jpg',
    previewImageUrls: ['/images/preview1.jpg'],
    pdfUrl: '/pdfs/test.pdf',
    pdfSizeBytes: 1000000,
    printingTips: ['Print on letter paper'],
    ...overrides,
  };
}

/**
 * Helper function to render HomePage with all required providers
 */
function renderHomePage(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <CartProvider>
        <BundleDataProvider>
          <FilterProvider>
            <HomePage />
          </FilterProvider>
        </BundleDataProvider>
      </CartProvider>
    </MemoryRouter>
  );
}

/**
 * Mock fetch for bundle data
 */
function mockFetchBundles(bundles: Bundle[]) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ bundles }),
  } as Response);
}

describe('HomePage', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
    
    // Reset scroll position
    window.scrollTo(0, 0);
    
    // Mock fetch with default bundles
    const mockBundles = [
      createMockBundle({ id: 'bundle-1', name: 'Bundle 1' }),
      createMockBundle({ id: 'bundle-2', name: 'Bundle 2' }),
      createMockBundle({ id: 'bundle-3', name: 'Bundle 3' }),
    ];
    mockFetchBundles(mockBundles);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Integration', () => {
    it('should render FilterPanel component', async () => {
      renderHomePage();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check for filter panel elements
      const filterPanel = screen.getByRole('complementary', { name: /filter bundles/i });
      expect(within(filterPanel).getByText(/age range/i)).toBeInTheDocument();
      expect(within(filterPanel).getByText(/^skills$/i)).toBeInTheDocument();
      expect(within(filterPanel).getByText(/price/i)).toBeInTheDocument();
    });

    it('should render BundleGrid component', async () => {
      renderHomePage();

      // Wait for bundles to load
      await waitFor(() => {
        expect(screen.getByText('Bundle 1')).toBeInTheDocument();
      });

      // Check that bundles are displayed
      expect(screen.getByText('Bundle 1')).toBeInTheDocument();
      expect(screen.getByText('Bundle 2')).toBeInTheDocument();
      expect(screen.getByText('Bundle 3')).toBeInTheDocument();
    });

    it('should display bundle count from FilterPanel', async () => {
      renderHomePage();

      // Wait for data to load
      await waitFor(() => {
        // The text is split across multiple elements, so we need to check for parts
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText(/bundles found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Context Integration', () => {
    it('should connect to BundleDataContext and display bundles', async () => {
      const mockBundles = [
        createMockBundle({ id: 'bundle-1', name: 'Test Bundle 1' }),
        createMockBundle({ id: 'bundle-2', name: 'Test Bundle 2' }),
      ];
      mockFetchBundles(mockBundles);

      renderHomePage();

      // Wait for bundles to load from context
      await waitFor(() => {
        expect(screen.getByText('Test Bundle 1')).toBeInTheDocument();
        expect(screen.getByText('Test Bundle 2')).toBeInTheDocument();
      });
    });

    it('should connect to FilterContext and display filtered bundles', async () => {
      const mockBundles = [
        createMockBundle({ id: 'bundle-1', name: 'Bundle 1', ageRange: '2-3' }),
        createMockBundle({ id: 'bundle-2', name: 'Bundle 2', ageRange: '3-4' }),
        createMockBundle({ id: 'bundle-3', name: 'Bundle 3', ageRange: '4-5' }),
      ];
      mockFetchBundles(mockBundles);

      renderHomePage();

      // Wait for bundles to load
      await waitFor(() => {
        expect(screen.getByText('Bundle 1')).toBeInTheDocument();
      });

      // Initially all bundles should be visible
      expect(screen.getByText('Bundle 1')).toBeInTheDocument();
      expect(screen.getByText('Bundle 2')).toBeInTheDocument();
      expect(screen.getByText('Bundle 3')).toBeInTheDocument();
    });

    it('should display loading state from BundleDataContext', () => {
      // Mock fetch to never resolve (simulating loading)
      globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

      renderHomePage();

      // Should show loading state
      expect(screen.getByRole('status', { name: /loading bundles/i })).toBeInTheDocument();
    });

    it('should display error state from BundleDataContext', async () => {
      // Mock fetch to fail
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      renderHomePage();

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/unable to load bundles/i)).toBeInTheDocument();
    });
  });

  describe('Scroll Position Restoration', () => {
    it('should save scroll position to sessionStorage on scroll', async () => {
      renderHomePage();

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByText('Bundle 1')).toBeInTheDocument();
      });

      // Simulate scroll
      window.scrollY = 500;
      window.dispatchEvent(new Event('scroll'));

      // Wait for scroll handler to execute
      await waitFor(() => {
        const savedPosition = sessionStorage.getItem('homepage-scroll-position');
        expect(savedPosition).toBe('500');
      });
    });

    it('should restore scroll position when navigating back with restoreScroll state', async () => {
      // Save a scroll position in sessionStorage
      sessionStorage.setItem('homepage-scroll-position', '300');

      // Mock window.scrollTo
      const scrollToMock = vi.fn();
      window.scrollTo = scrollToMock;

      // Render with location state indicating we should restore scroll
      render(
        <MemoryRouter initialEntries={[{ pathname: '/', state: { restoreScroll: true } }]}>
          <CartProvider>
            <BundleDataProvider>
              <FilterProvider>
                <HomePage />
              </FilterProvider>
            </BundleDataProvider>
          </CartProvider>
        </MemoryRouter>
      );

      // Wait for scroll restoration
      await waitFor(() => {
        expect(scrollToMock).toHaveBeenCalledWith(0, 300);
      });
    });

    it('should not restore scroll position when navigating without restoreScroll state', async () => {
      // Save a scroll position in sessionStorage
      sessionStorage.setItem('homepage-scroll-position', '300');

      // Mock window.scrollTo
      const scrollToMock = vi.fn();
      window.scrollTo = scrollToMock;

      // Render without restoreScroll state
      renderHomePage();

      // Wait a bit to ensure scroll restoration doesn't happen
      await new Promise(resolve => setTimeout(resolve, 100));

      // scrollTo should not have been called
      expect(scrollToMock).not.toHaveBeenCalled();
    });

    it('should save scroll position before navigating to bundle detail', async () => {
      renderHomePage();

      // Wait for bundles to load
      await waitFor(() => {
        expect(screen.getByText('Bundle 1')).toBeInTheDocument();
      });

      // Set scroll position
      window.scrollY = 400;

      // Find and click a bundle card
      const bundleCard = screen.getByText('Bundle 1').closest('article');
      expect(bundleCard).toBeInTheDocument();

      if (bundleCard) {
        bundleCard.click();
      }

      // Check that scroll position was saved
      const savedPosition = sessionStorage.getItem('homepage-scroll-position');
      expect(savedPosition).toBe('400');
    });
  });

  describe('Responsive Layout', () => {
    it('should render with proper layout structure', async () => {
      renderHomePage();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Bundle 1')).toBeInTheDocument();
      });

      // Check for main layout elements
      const sidebar = screen.getByRole('complementary', { name: /filter bundles/i });
      const content = screen.getByRole('region', { name: /bundle grid/i });

      expect(sidebar).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });
  });
});
