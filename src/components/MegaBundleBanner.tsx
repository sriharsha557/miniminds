import { useNavigate } from 'react-router-dom';
import { useBundleData } from '../contexts/BundleDataContext';
import { useCart } from '../contexts/CartContext';
import styles from './MegaBundleBanner.module.css';

const MEGA_BUNDLE_ID = 'mega-bundle-complete-collection';

/**
 * Prominent sale banner for the Mega Bundle.
 * CTA adds the bundle to cart and routes directly to checkout.
 */
export function MegaBundleBanner() {
  const navigate = useNavigate();
  const { bundles } = useBundleData();
  const { addItem } = useCart();

  const megaBundle = bundles.find((bundle) => bundle.id === MEGA_BUNDLE_ID);

  const handleClick = () => {
    if (!megaBundle || megaBundle.isFree) {
      navigate('/contact', { state: { inquiryType: 'mega-bundle' } });
      return;
    }

    addItem(megaBundle);
    navigate('/checkout');
  };

  return (
    <section className={styles.banner} aria-label="Special Offer">
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <img
            src="/images/mega-bundle.jpg"
            alt="Mega Bundle - 10,000 Worksheets"
            className={styles.image}
          />
          <div className={styles.overlay} />
        </div>

        <div className={styles.content}>
          <div className={styles.saleBadge}>
            <span className={styles.saleText}>LIMITED TIME OFFER</span>
          </div>

          <h2 className={styles.title}>
            <span className={styles.titleHighlight}>MEGA BUNDLE</span>
          </h2>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>10,000+</span>
              <span className={styles.statLabel}>Worksheets</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>All Ages</span>
              <span className={styles.statLabel}>2-6 Years</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>All Skills</span>
              <span className={styles.statLabel}>Complete Collection</span>
            </div>
          </div>

          <div className={styles.priceSection}>
            <span className={styles.originalPrice}>INR 4,999</span>
            <span className={styles.salePrice}>INR 199</span>
            <span className={styles.saveText}>Save 96%!</span>
          </div>

          <p className={styles.description}>
            Get instant access to our complete collection of educational worksheets.
            Perfect for homeschooling, preschools, and learning centers.
          </p>

          <button
            className={styles.ctaButton}
            onClick={handleClick}
            aria-label="Get the Mega Bundle for INR 199"
            disabled={!megaBundle}
          >
            Get Mega Bundle Now
            <span className={styles.ctaPrice}>Only INR 199</span>
          </button>

          <p className={styles.guarantee}>
            Instant PDF Download | Lifetime Access | Print Unlimited
          </p>
        </div>
      </div>
    </section>
  );
}
