/**
 * FilterPanel Component Tests
 * 
 * Tests filter interactions, count display, and clear all functionality.
 * Requirements: 2.1, 3.1, 4.1, 10.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from './FilterPanel';
import { FilterProvider } from '../contexts/FilterContext';
import { BundleDataProvider } from '../contexts/BundleDataContext';
import type { Bundle } from '../types/bundle';

/**
 * Create a mock bundle for testing
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
    coverImageUrl: '/test-cover.jpg',
    previewImageUrls: ['/test-preview.jpg'],
    pdfUrl: '/test.pdf',
    pdfSizeBytes: 1000000,
    printingTips: ['Print on letter paper'],
    ...overrides,
  };
}

/**
 * Helper to find text that may be split across elements
 * Returns the parent element containing the count
 */
async function findByBundleCount(count: number, singular = false) {
  const text = singular ? 'bundle found' : 'bundles found';
  // Find the count element by looking for the aria-live region
  const countElement = await screen.findByRole('status', { hidden: true });
  
  // Verify it contains the expected text
  expect(countElement.textContent).toContain(String(count));
  expect(countElement.textContent).toContain(text);
  
  return countElement;
}

/**
 * Wrapper component that provides necessary contexts
 */
function TestWrapper({ children, bundles = [] }: { children: React.ReactNode; bundles?: Bundle[] }) {
  // Mock the fetch function
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ bundles }),
    } as Response)
  );

  return (
    <BundleDataProvider>
      <FilterProvider>
        {children}
      </FilterProvider>
    </BundleDataProvider>
  );
}

describe('FilterPanel', () => {
  describe('Initial Render', () => {
    it('should render the filter panel with all filter groups', () => {
      render(
        <TestWrapper>
          <FilterPanel />
        </TestWrapper>
      );

      // Check for filter group titles
      expect(screen.getByText('Age Range')).toBeInTheDocument();
      expect(screen.getByText('Skills')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
    });

    it('should render all age range options', () => {
      render(
        <TestWrapper>
          <FilterPanel />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Age 2-3 years')).toBeInTheDocument();
      expect(screen.getByLabelText('Age 3-4 years')).toBeInTheDocument();
      expect(screen.getByLabelText('Age 4-5 years')).toBeInTheDocument();
      expect(screen.getByLabelText('Age 5-6 years')).toBeInTheDocument();
    });

    it('should render all skill options', () => {
      render(
        <TestWrapper>
          <FilterPanel />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Alphabet')).toBeInTheDocument();
      expect(screen.getByLabelText('Numbers')).toBeInTheDocument();
      expect(screen.getByLabelText('Shapes/Colors')).toBeInTheDocument();
      expect(screen.getByLabelText('Tracing')).toBeInTheDocument();
      expect(screen.getByLabelText('Logical Thinking')).toBeInTheDocument();
    });

    it('should render free-only price filter', () => {
      render(
        <TestWrapper>
          <FilterPanel />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Show free bundles only')).toBeInTheDocument();
    });

    it('should display bundle count (Requirement 10.4)', async () => {
      const bundles = [
        createMockBundle({ id: '1' }),
        createMockBundle({ id: '2' }),
        createMockBundle({ id: '3' }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      // Wait for bundles to load
      await findByBundleCount(3);
    });

    it('should use singular "bundle" for count of 1', async () => {
      const bundles = [createMockBundle()];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(1, true);
    });
  });

  describe('Age Range Filter (Requirement 2.1)', () => {
    it('should toggle age range filter when checkbox is clicked', async () => {
      const bundles = [
        createMockBundle({ id: '1', ageRange: '2-3' }),
        createMockBundle({ id: '2', ageRange: '3-4' }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      // Initially shows all bundles
      await findByBundleCount(2);

      // Click age range filter
      const ageCheckbox = screen.getByLabelText('Age 2-3 years');
      fireEvent.click(ageCheckbox);

      // Should now show only 1 bundle
      await findByBundleCount(1, true);
    });

    it('should allow multiple age ranges to be selected', async () => {
      const bundles = [
        createMockBundle({ id: '1', ageRange: '2-3' }),
        createMockBundle({ id: '2', ageRange: '3-4' }),
        createMockBundle({ id: '3', ageRange: '4-5' }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(3);

      // Select two age ranges
      fireEvent.click(screen.getByLabelText('Age 2-3 years'));
      fireEvent.click(screen.getByLabelText('Age 3-4 years'));

      // Should show 2 bundles
      await findByBundleCount(2);
    });

    it('should uncheck age range when clicked again', async () => {
      const bundles = [
        createMockBundle({ id: '1', ageRange: '2-3' }),
        createMockBundle({ id: '2', ageRange: '3-4' }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(2);

      const ageCheckbox = screen.getByLabelText('Age 2-3 years');
      
      // Check
      fireEvent.click(ageCheckbox);
      await findByBundleCount(1, true);
      
      // Uncheck
      fireEvent.click(ageCheckbox);
      await findByBundleCount(2);
    });
  });

  describe('Skill Filter (Requirement 3.1)', () => {
    it('should toggle skill filter when checkbox is clicked', async () => {
      const bundles = [
        createMockBundle({ id: '1', skills: ['Alphabet'] }),
        createMockBundle({ id: '2', skills: ['Numbers'] }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(2);

      // Click skill filter
      const skillCheckbox = screen.getByLabelText('Alphabet');
      fireEvent.click(skillCheckbox);

      // Should now show only 1 bundle
      await findByBundleCount(1, true);
    });

    it('should allow multiple skills to be selected', async () => {
      const bundles = [
        createMockBundle({ id: '1', skills: ['Alphabet'] }),
        createMockBundle({ id: '2', skills: ['Numbers'] }),
        createMockBundle({ id: '3', skills: ['Tracing'] }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(3);

      // Select two skills
      fireEvent.click(screen.getByLabelText('Alphabet'));
      fireEvent.click(screen.getByLabelText('Numbers'));

      // Should show 2 bundles
      await findByBundleCount(2);
    });

    it('should match bundles with any of the selected skills', async () => {
      const bundles = [
        createMockBundle({ id: '1', skills: ['Alphabet', 'Tracing'] }),
        createMockBundle({ id: '2', skills: ['Numbers'] }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(2);

      // Select Alphabet - should match bundle 1 which has both Alphabet and Tracing
      fireEvent.click(screen.getByLabelText('Alphabet'));
      await findByBundleCount(1, true);
    });
  });

  describe('Price Filter (Requirement 4.1)', () => {
    it('should toggle free-only filter when checkbox is clicked', async () => {
      const bundles = [
        createMockBundle({ id: '1', isFree: true }),
        createMockBundle({ id: '2', isFree: false, price: 9.99 }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(2);

      // Click free-only filter
      const freeCheckbox = screen.getByLabelText('Show free bundles only');
      fireEvent.click(freeCheckbox);

      // Should now show only 1 bundle
      await findByBundleCount(1, true);
    });

    it('should uncheck free-only when clicked again', async () => {
      const bundles = [
        createMockBundle({ id: '1', isFree: true }),
        createMockBundle({ id: '2', isFree: false, price: 9.99 }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(2);

      const freeCheckbox = screen.getByLabelText('Show free bundles only');
      
      // Check
      fireEvent.click(freeCheckbox);
      await findByBundleCount(1, true);
      
      // Uncheck
      fireEvent.click(freeCheckbox);
      await findByBundleCount(2);
    });
  });

  describe('Combined Filters', () => {
    it('should apply age and skill filters together (AND logic)', async () => {
      const bundles = [
        createMockBundle({ id: '1', ageRange: '2-3', skills: ['Alphabet'] }),
        createMockBundle({ id: '2', ageRange: '3-4', skills: ['Alphabet'] }),
        createMockBundle({ id: '3', ageRange: '2-3', skills: ['Numbers'] }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(3);

      // Select age 2-3 and skill Alphabet
      fireEvent.click(screen.getByLabelText('Age 2-3 years'));
      fireEvent.click(screen.getByLabelText('Alphabet'));

      // Should show only bundle 1 (matches both age 2-3 AND Alphabet)
      await findByBundleCount(1, true);
    });

    it('should apply all three filter types together', async () => {
      const bundles = [
        createMockBundle({ id: '1', ageRange: '2-3', skills: ['Alphabet'], isFree: true }),
        createMockBundle({ id: '2', ageRange: '2-3', skills: ['Alphabet'], isFree: false, price: 9.99 }),
        createMockBundle({ id: '3', ageRange: '3-4', skills: ['Numbers'], isFree: true }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(3);

      // Select age 2-3, skill Alphabet, and free-only
      fireEvent.click(screen.getByLabelText('Age 2-3 years'));
      fireEvent.click(screen.getByLabelText('Alphabet'));
      fireEvent.click(screen.getByLabelText('Show free bundles only'));

      // Should show only bundle 1
      await findByBundleCount(1, true);
    });
  });

  describe('Clear All Button (Requirement 3.5)', () => {
    it('should show clear all button when filters are active', async () => {
      const bundles = [createMockBundle()];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      // Initially no clear button
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();

      // Apply a filter
      fireEvent.click(screen.getByLabelText('Age 2-3 years'));

      // Clear button should appear
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should clear all filters when clear all button is clicked', async () => {
      const bundles = [
        createMockBundle({ id: '1', ageRange: '2-3', skills: ['Alphabet'], isFree: true }),
        createMockBundle({ id: '2', ageRange: '3-4', skills: ['Numbers'], isFree: false, price: 9.99 }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(2);

      // Apply multiple filters
      fireEvent.click(screen.getByLabelText('Age 2-3 years'));
      fireEvent.click(screen.getByLabelText('Alphabet'));
      fireEvent.click(screen.getByLabelText('Show free bundles only'));

      await findByBundleCount(1, true);

      // Click clear all
      const clearButton = screen.getByText('Clear All');
      fireEvent.click(clearButton);

      // Should show all bundles again
      await findByBundleCount(2);

      // All checkboxes should be unchecked
      expect(screen.getByLabelText('Age 2-3 years')).not.toBeChecked();
      expect(screen.getByLabelText('Alphabet')).not.toBeChecked();
      expect(screen.getByLabelText('Show free bundles only')).not.toBeChecked();
    });

    it('should hide clear all button after clearing filters', async () => {
      const bundles = [createMockBundle()];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      // Apply a filter
      fireEvent.click(screen.getByLabelText('Age 2-3 years'));
      expect(screen.getByText('Clear All')).toBeInTheDocument();

      // Clear filters
      fireEvent.click(screen.getByText('Clear All'));

      // Clear button should be hidden
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Toggle', () => {
    it('should render mobile toggle button', () => {
      render(
        <TestWrapper>
          <FilterPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByLabelText('Toggle filters');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should show filter count in mobile toggle when filters are active', async () => {
      const bundles = [createMockBundle()];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      // Apply filters
      fireEvent.click(screen.getByLabelText('Age 2-3 years'));
      fireEvent.click(screen.getByLabelText('Alphabet'));

      // Toggle button should show count
      expect(screen.getByText(/Filters \(2\)/)).toBeInTheDocument();
    });

    it('should toggle expanded state when mobile toggle is clicked', () => {
      render(
        <TestWrapper>
          <FilterPanel />
        </TestWrapper>
      );

      const toggleButton = screen.getByLabelText('Toggle filters');
      
      // Initially collapsed (aria-expanded should be false)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <FilterPanel />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Filter bundles')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle filters')).toBeInTheDocument();
      
      // Groups are present in the DOM but may be hidden by CSS on mobile
      // Use queryByRole with hidden: true to find them
      expect(screen.getByRole('group', { name: 'Age range filters', hidden: true })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Skill filters', hidden: true })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Price filters', hidden: true })).toBeInTheDocument();
    });

    it('should have aria-live region for bundle count', async () => {
      const bundles = [createMockBundle()];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      const countElement = await findByBundleCount(1, true);
      expect(countElement).toHaveAttribute('aria-live', 'polite');
      expect(countElement).toHaveAttribute('aria-atomic', 'true');
    });

    it('should be keyboard accessible', async () => {
      const bundles = [createMockBundle()];
      
      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      // Wait for component to render
      await findByBundleCount(1, true);

      // All checkboxes should be focusable (even if hidden by CSS)
      // Use getAllByRole with hidden: true
      const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toHaveAttribute('tabindex', '-1');
      });

      // Buttons should be focusable
      const toggleButton = screen.getByLabelText('Toggle filters');
      expect(toggleButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty bundle list', async () => {
      render(
        <TestWrapper bundles={[]}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(0);
    });

    it('should handle filters with no matching bundles', async () => {
      const bundles = [
        createMockBundle({ id: '1', ageRange: '2-3', skills: ['Alphabet'] }),
      ];

      render(
        <TestWrapper bundles={bundles}>
          <FilterPanel />
        </TestWrapper>
      );

      await findByBundleCount(1, true);

      // Apply filter that doesn't match any bundles
      fireEvent.click(screen.getByLabelText('Age 5-6 years'));

      await findByBundleCount(0);
    });
  });
});
