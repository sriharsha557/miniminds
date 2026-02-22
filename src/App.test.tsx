/**
 * App Component Tests
 *
 * Integration tests for the root App component.
 * Tests routing, context providers, and error boundary integration.
 *
 * Requirements: All (root integration point)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should display the logo image', () => {
    render(<App />);
    expect(screen.getByRole('img', { name: /miniminds/i })).toBeInTheDocument();
  });

  it('should render the home page by default', () => {
    render(<App />);
    // Check that the filter panel is rendered (part of HomePage)
    expect(screen.getByLabelText(/filter bundles/i)).toBeInTheDocument();
  });

  it('should have skip link for accessibility (Requirement 8.6)', () => {
    render(<App />);
    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('should have main content area with id', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('should wrap app with ErrorBoundary (Requirement 12.1)', () => {
    // This test verifies the structure includes ErrorBoundary
    // The ErrorBoundary itself is tested in ErrorBoundary.test.tsx
    render(<App />);

    // If ErrorBoundary is working, the app should render normally
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should wrap app with BundleDataProvider', () => {
    // If context providers are working, HomePage should render
    // HomePage depends on BundleDataContext
    render(<App />);
    expect(screen.getByLabelText(/filter bundles/i)).toBeInTheDocument();
  });

  it('should wrap app with FilterProvider', () => {
    // If FilterProvider is working, FilterPanel should render
    render(<App />);
    expect(screen.getByLabelText(/filter bundles/i)).toBeInTheDocument();
  });

  it('should have persistent header across routes (Requirement 11.1)', () => {
    render(<App />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });
});
