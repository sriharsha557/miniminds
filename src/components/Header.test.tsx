import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from './Header';
import { CartProvider } from '../contexts/CartContext';

/**
 * Unit tests for Header component
 * Requirements: 11.1, 11.2
 */

function renderHeader() {
  return render(
    <BrowserRouter>
      <CartProvider>
        <Header />
      </CartProvider>
    </BrowserRouter>
  );
}

describe('Header', () => {
  test('displays the logo image', () => {
    renderHeader();
    const logo = screen.getByRole('img', { name: /miniminds/i });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/images/miniminds_logo.png');
  });

  test('does not render text label next to logo', () => {
    renderHeader();
    expect(screen.queryByText('MiniMinds')).not.toBeInTheDocument();
  });

  test('has a link to the homepage from the logo', () => {
    renderHeader();
    const logoLink = screen.getByRole('link', { name: /miniminds home/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  test('has a navigation link to the homepage', () => {
    renderHeader();
    const homeLinks = screen.getAllByRole('link', { name: /home/i });
    // Should have at least one home link in the navigation
    expect(homeLinks.length).toBeGreaterThan(0);
    expect(homeLinks[0]).toHaveAttribute('href', '/');
  });

  test('has accessible navigation landmark', () => {
    renderHeader();
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
  });

  test('logo link is keyboard accessible', () => {
    renderHeader();
    const logoLink = screen.getByRole('link', { name: /miniminds home/i });
    expect(logoLink).toBeInTheDocument();
    // Link should be focusable
    logoLink.focus();
    expect(document.activeElement).toBe(logoLink);
  });

  test('navigation links are keyboard accessible', () => {
    renderHeader();
    const homeLink = screen.getByRole('link', { name: /^home$/i });
    expect(homeLink).toBeInTheDocument();
    // Link should be focusable
    homeLink.focus();
    expect(document.activeElement).toBe(homeLink);
  });
});
