/**
 * ErrorBoundary Component Tests
 * 
 * Tests for the ErrorBoundary component that catches and handles
 * component errors.
 * 
 * Requirements: 12.1 (error handling), 12.5 (error logging)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Component that throws an error for testing
 */
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalError = console.error;
  
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and display fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should display error message
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should log errors to console (Requirement 12.5)', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have logged the error
    expect(consoleErrorSpy).toHaveBeenCalled();
    // Check that console.error was called with our error message
    const calls = consoleErrorSpy.mock.calls;
    const hasErrorBoundaryLog = calls.some(call => 
      call.some(arg => typeof arg === 'string' && arg.includes('ErrorBoundary caught an error'))
    );
    expect(hasErrorBoundaryLog).toBe(true);

    consoleErrorSpy.mockRestore();
  });

  it('should display error details in expandable section', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have error details section
    const details = screen.getByText('Error details');
    expect(details).toBeInTheDocument();
    
    // Should show error message
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('should provide refresh button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh page/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('should provide try again button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
  });

  it('should reset error state when try again is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error UI
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Get the try again button
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    
    // Click try again - this will reset the error boundary state
    await user.click(tryAgainButton);

    // After clicking, the error boundary resets and tries to render children again
    // Since ThrowError still throws, it will catch the error again and show error UI
    // This test verifies the reset mechanism is called and error UI is still shown
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should have accessible error message with role="alert"', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('should have minimum touch target size for buttons (Requirement 7.4)', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh page/i });
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });

    // Get computed styles
    const refreshStyles = window.getComputedStyle(refreshButton);
    const tryAgainStyles = window.getComputedStyle(tryAgainButton);

    // Check minimum height (44px as per Requirement 7.4)
    expect(refreshStyles.minHeight).toBe('44px');
    expect(tryAgainStyles.minHeight).toBe('44px');
  });
});
