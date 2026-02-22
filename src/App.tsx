/**
 * App Component
 * 
 * Root application component that sets up routing, context providers,
 * and error boundaries.
 * 
 * Architecture:
 * - ErrorBoundary wraps entire app to catch component errors
 * - BrowserRouter provides client-side routing
 * - BundleDataProvider provides bundle data to all components
 * - FilterProvider manages filter state
 * - Routes define page navigation
 * 
 * Requirements: All (root integration point)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header, ErrorBoundary } from './components';
import { BundleDataProvider } from './contexts/BundleDataContext';
import { FilterProvider } from './contexts/FilterContext';
import { CartProvider } from './contexts/CartContext';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { FAQPage } from './pages/FAQPage';
import { ContactPage } from './pages/ContactPage';
import { BundleDetailPage } from './pages/BundleDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Main App component
 * 
 * Features:
 * - Error boundary at root level (Requirement 12.1)
 * - React Router for navigation (Requirement 11.1-11.5)
 * - Context providers for state management
 * - Skip link for accessibility (Requirement 8.6)
 * - Placeholder for BundleDetailPage (to be implemented)
 */
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <BundleDataProvider>
          <CartProvider>
            <FilterProvider>
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <Header />
              <main id="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/bundle/:bundleId" element={<BundleDetailPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/checkout/:bundleId" element={<CheckoutPage />} />
                  <Route path="/payment/success" element={<PaymentSuccessPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
            </FilterProvider>
          </CartProvider>
        </BundleDataProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
