/**
 * ErrorBoundary Component
 * 
 * Catches React component errors and displays a user-friendly fallback UI.
 * Logs errors to console for debugging.
 * 
 * Requirements: 12.1 (error handling), 12.5 (error logging)
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches errors in child components
 * 
 * Features:
 * - Catches component errors during rendering, lifecycle methods, and constructors
 * - Displays user-friendly error fallback UI
 * - Logs errors to console for debugging (Requirement 12.5)
 * - Provides retry functionality to reset error state
 * 
 * Requirements: 12.1, 12.5
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details to console (Requirement 12.5)
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging (Requirement 12.5)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  /**
   * Reset error state to retry rendering
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  /**
   * Reload the page as a fallback recovery option
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary} role="alert">
          <div className={styles.errorContent}>
            <div className={styles.errorIcon} aria-hidden="true">⚠️</div>
            <h1 className={styles.errorTitle}>Oops! Something went wrong</h1>
            <p className={styles.errorMessage}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details className={styles.errorDetails}>
                <summary>Error details</summary>
                <pre className={styles.errorStack}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className={styles.errorActions}>
              <button
                onClick={this.handleReload}
                className={styles.primaryButton}
                type="button"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                className={styles.secondaryButton}
                type="button"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
