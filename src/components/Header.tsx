import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import styles from './Header.module.css';

/**
 * Header component with logo and navigation
 * Displays the MiniMinds logo and site name
 * Persistent across all pages with responsive layout
 *
 * Requirements: 11.1, 11.2, 7.5
 */
export function Header() {
  const { itemCount } = useCart();
  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.activeLink : ''}`.trim();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logoLink} aria-label="MiniMinds home">
          <img
            src="/images/miniminds_logo.png"
            alt="MiniMinds"
            className={styles.logo}
          />
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink to="/" className={getNavClassName} end>
            Home
          </NavLink>
          <NavLink to="/about" className={getNavClassName}>
            About
          </NavLink>
          <NavLink to="/faq" className={getNavClassName}>
            FAQ
          </NavLink>
          <NavLink to="/contact" className={getNavClassName}>
            Contact
          </NavLink>
          <NavLink to="/checkout" className={getNavClassName}>
            Cart
            {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
