/**
 * Unit tests for BundleDataContext
 * 
 * Tests error handling, loading states, and basic functionality
 * Requirements: 9.5, 12.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BundleDataProvider, useBundleData } from './BundleDataContext';
import { Bundle } from '../types/bundle';

// Test component that uses the context
function TestConsumer() {
  const { bundles, isLoading, error, refetch } = useBundleData();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error ? error.message : 'no-error'}</div>
      <div data-testid="bundle-count">{bundles.length}</div>
      <button onClick={refetch}>Refetch</button>
    </div>
  );
}

// Mock bundle data
const mockBundles: Bundle[] = [
  {
    id: 'test-1',
    name: 'Test Bundle 1',
    ageRange: '3-4',
    skills: ['Alphabet'],
    learningGoals: ['Learn letters'],
    worksheetCount: 10,
    isFree: true,
    coverImageUrl: '/test.jpg',
    previewImageUrls: ['/preview1.jpg'],
    pdfUrl: '/test.pdf',
    pdfSizeBytes: 1000000,
    printingTips: ['Print on letter paper'],
  },
  {
    id: 'test-2',
    name: 'Test Bundle 2',
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
];

describe('BundleDataContext', () => {
  // Store original fetch
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });
  
  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('should throw error when useBundleData is used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useBundleData must be used within a BundleDataProvider');
    
    consoleError.mockRestore();
  });

  it('should fetch bundles successfully on mount', async () => {
    // Mock successful fetch
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bundles: mockBundles }),
    });

    render(
      <BundleDataProvider>
        <TestConsumer />
      </BundleDataProvider>
    );

    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(screen.getByTestId('bundle-count')).toHaveTextContent('0');

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Should have loaded bundles
    expect(screen.getByTestId('bundle-count')).toHaveTextContent('2');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should handle network errors gracefully', async () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock network error - TypeError with 'fetch' in message
    const fetchMock = vi.fn().mockRejectedValueOnce(
      Object.assign(new TypeError('Failed to fetch'), { message: 'Failed to fetch' })
    );
    global.fetch = fetchMock;

    render(
      <BundleDataProvider>
        <TestConsumer />
      </BundleDataProvider>
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Should show network error message
    expect(screen.getByTestId('error')).toHaveTextContent('Network error');
    expect(screen.getByTestId('bundle-count')).toHaveTextContent('0');
    
    // Should log error to console (Requirement 12.5)
    expect(consoleError).toHaveBeenCalled();
    
    consoleError.mockRestore();
  });

  it('should handle HTTP error responses', async () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock 404 response
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    global.fetch = fetchMock;

    render(
      <BundleDataProvider>
        <TestConsumer />
      </BundleDataProvider>
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Should show HTTP error message
    expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch bundles: 404 Not Found');
    expect(screen.getByTestId('bundle-count')).toHaveTextContent('0');
    
    // Should log error to console (Requirement 12.5)
    expect(consoleError).toHaveBeenCalled();
    
    consoleError.mockRestore();
  });

  it('should handle invalid data format', async () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock response with invalid data format
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'data' }),
    });
    global.fetch = fetchMock;

    render(
      <BundleDataProvider>
        <TestConsumer />
      </BundleDataProvider>
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Should show validation error message
    expect(screen.getByTestId('error')).toHaveTextContent('Invalid bundle data format');
    expect(screen.getByTestId('bundle-count')).toHaveTextContent('0');
    
    // Should log error to console (Requirement 12.5)
    expect(consoleError).toHaveBeenCalled();
    
    consoleError.mockRestore();
  });

  it('should cache data and not refetch on subsequent renders', async () => {
    // Mock successful fetch
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bundles: mockBundles }),
    });
    global.fetch = fetchMock;

    const { rerender } = render(
      <BundleDataProvider>
        <TestConsumer />
      </BundleDataProvider>
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Get the initial call count (should be 1)
    const initialCallCount = fetchMock.mock.calls.length;
    expect(initialCallCount).toBeGreaterThanOrEqual(1);

    // Rerender the component
    rerender(
      <BundleDataProvider>
        <TestConsumer />
      </BundleDataProvider>
    );

    // Wait a bit to ensure no additional fetch
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch should not have been called again (caching works)
    expect(fetchMock.mock.calls.length).toBe(initialCallCount);
  });

  it('should allow manual refetch that bypasses cache', async () => {
    // Mock successful fetch
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bundles: mockBundles }),
    });
    global.fetch = fetchMock;

    render(
      <BundleDataProvider>
        <TestConsumer />
      </BundleDataProvider>
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Clear the mock calls to start fresh
    fetchMock.mockClear();

    // Click refetch button
    const refetchButton = screen.getByText('Refetch');
    refetchButton.click();

    // Wait for refetch to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Fetch should have been called at least once for refetch
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle refetch errors', async () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock successful initial fetch, then error on subsequent calls
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bundles: mockBundles }),
        });
      }
      return Promise.reject(new Error('Refetch failed'));
    });
    
    global.fetch = fetchMock;

    render(
      <BundleDataProvider>
        <TestConsumer />
      </BundleDataProvider>
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Should have loaded successfully
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('bundle-count')).toHaveTextContent('2');

    // Click refetch button
    const refetchButton = screen.getByText('Refetch');
    refetchButton.click();

    // Wait for refetch to complete
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Refetch failed');
    });

    // Should show error
    expect(screen.getByTestId('error')).toHaveTextContent('Refetch failed');
    
    // Should log error to console (Requirement 12.5)
    expect(consoleError).toHaveBeenCalledWith(
      'Bundle refetch error:',
      expect.any(Error)
    );
    
    consoleError.mockRestore();
  });
});
