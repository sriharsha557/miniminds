import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BundleCard } from './BundleCard';
import type { Bundle } from '../types/bundle';

/**
 * Helper function to create a mock bundle for testing
 */
function createMockBundle(overrides?: Partial<Bundle>): Bundle {
  return {
    id: 'test-bundle-123',
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

describe('BundleCard', () => {
  describe('Display Requirements (1.1, 1.2)', () => {
    it('displays bundle name', () => {
      const bundle = createMockBundle({ name: 'Alphabet Tracing Basics' });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText('Alphabet Tracing Basics')).toBeInTheDocument();
    });

    it('displays age range', () => {
      const bundle = createMockBundle({ ageRange: '4-5' });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText('4-5 years')).toBeInTheDocument();
    });

    it('displays worksheet count', () => {
      const bundle = createMockBundle({ worksheetCount: 25 });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('displays all skills as tags', () => {
      const bundle = createMockBundle({ 
        skills: ['Alphabet', 'Numbers', 'Tracing'] 
      });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText('Alphabet')).toBeInTheDocument();
      expect(screen.getByText('Numbers')).toBeInTheDocument();
      expect(screen.getByText('Tracing')).toBeInTheDocument();
    });

    it('displays free badge for free bundles', () => {
      const bundle = createMockBundle({ isFree: true });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText('Free')).toBeInTheDocument();
    });

    it('displays price badge for paid bundles', () => {
      const bundle = createMockBundle({ isFree: false, price: 9.99 });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText('INR 9.99')).toBeInTheDocument();
    });

    it('displays cover image with lazy loading (Requirement 9.4)', () => {
      const bundle = createMockBundle({ 
        name: 'Test Bundle',
        coverImageUrl: '/images/test-cover.jpg' 
      });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      const img = screen.getByRole('img', { name: /Test Bundle cover/i });
      expect(img).toHaveAttribute('src', '/images/test-cover.jpg');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('displays cover image with alt text (Requirement 8.5)', () => {
      const bundle = createMockBundle({ name: 'Alphabet Bundle' });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      const img = screen.getByRole('img', { name: /Alphabet Bundle cover/i });
      expect(img).toHaveAttribute('alt');
      expect(img.getAttribute('alt')).toBeTruthy();
    });
  });

  describe('Navigation (Requirement 5.1)', () => {
    it('calls onClick with bundle ID when card is clicked', () => {
      const mockOnClick = vi.fn();
      const bundle = createMockBundle({ id: 'bundle-abc-123' });
      render(<BundleCard bundle={bundle} onClick={mockOnClick} />);
      
      const card = screen.getByRole('button', { name: /View details for Test Bundle/i });
      fireEvent.click(card);
      
      expect(mockOnClick).toHaveBeenCalledWith('bundle-abc-123');
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when Enter key is pressed (Requirement 8.6)', () => {
      const mockOnClick = vi.fn();
      const bundle = createMockBundle({ id: 'bundle-xyz-789' });
      render(<BundleCard bundle={bundle} onClick={mockOnClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(mockOnClick).toHaveBeenCalledWith('bundle-xyz-789');
    });

    it('calls onClick when Space key is pressed (Requirement 8.6)', () => {
      const mockOnClick = vi.fn();
      const bundle = createMockBundle({ id: 'bundle-space-test' });
      render(<BundleCard bundle={bundle} onClick={mockOnClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });
      
      expect(mockOnClick).toHaveBeenCalledWith('bundle-space-test');
    });

    it('does not call onClick for other keys', () => {
      const mockOnClick = vi.fn();
      const bundle = createMockBundle();
      render(<BundleCard bundle={bundle} onClick={mockOnClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Tab' });
      fireEvent.keyDown(card, { key: 'Escape' });
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility (Requirements 8.5, 8.6)', () => {
    it('is keyboard accessible with tabIndex', () => {
      const bundle = createMockBundle();
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('has appropriate ARIA label', () => {
      const bundle = createMockBundle({ name: 'Numbers Fun Pack' });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      const card = screen.getByRole('button', { 
        name: 'View details for Numbers Fun Pack' 
      });
      expect(card).toBeInTheDocument();
    });

    it('has ARIA label for free badge', () => {
      const bundle = createMockBundle({ isFree: true });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      const badge = screen.getByLabelText('Free bundle');
      expect(badge).toBeInTheDocument();
    });

    it('has ARIA label for paid badge', () => {
      const bundle = createMockBundle({ isFree: false, price: 14.99 });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      const badge = screen.getByLabelText('Paid bundle');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Responsive Layout (Requirements 7.1, 7.2, 7.3, 7.4)', () => {
    it('renders as an article element', () => {
      const bundle = createMockBundle();
      const { container } = render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
    });

    it('has proper structure for responsive layout', () => {
      const bundle = createMockBundle({ name: 'Test Bundle' });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      // Check for image
      const image = screen.getByRole('img', { name: /Test Bundle cover/i });
      expect(image).toBeInTheDocument();
      
      // Check for content elements
      expect(screen.getByText('Test Bundle')).toBeInTheDocument();
      expect(screen.getByText(/Age:/i)).toBeInTheDocument();
      expect(screen.getByText(/Worksheets:/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles bundle with single skill', () => {
      const bundle = createMockBundle({ skills: ['Alphabet'] });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText('Alphabet')).toBeInTheDocument();
    });

    it('handles bundle with maximum skills', () => {
      const bundle = createMockBundle({ 
        skills: ['Alphabet', 'Numbers', 'Shapes/Colors', 'Tracing', 'Logical Thinking'] 
      });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText('Alphabet')).toBeInTheDocument();
      expect(screen.getByText('Numbers')).toBeInTheDocument();
      expect(screen.getByText('Shapes/Colors')).toBeInTheDocument();
      expect(screen.getByText('Tracing')).toBeInTheDocument();
      expect(screen.getByText('Logical Thinking')).toBeInTheDocument();
    });

    it('handles long bundle names', () => {
      const bundle = createMockBundle({ 
        name: 'Super Long Bundle Name That Tests Text Wrapping and Layout' 
      });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText(/Super Long Bundle Name/i)).toBeInTheDocument();
    });

    it('formats price with two decimal places', () => {
      const bundle = createMockBundle({ isFree: false, price: 5 });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText('INR 5.00')).toBeInTheDocument();
    });

    it('handles high worksheet count', () => {
      const bundle = createMockBundle({ worksheetCount: 150 });
      render(<BundleCard bundle={bundle} onClick={vi.fn()} />);
      
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });
});
