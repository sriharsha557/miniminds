/**
 * HomePage Component
 * 
 * Main landing page that displays the FilterPanel and BundleGrid.
 * Integrates with FilterContext and BundleDataContext to provide
 * filtered bundle display.
 * 
 * Features:
 * - Scroll position restoration when navigating back from detail page (Requirement 11.5)
 * - Filter and bundle grid integration (Requirements 2.4, 10.2)
 * 
 * Requirements: 2.4, 10.2, 11.5
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FilterPanel, BundleGrid, MegaBundleBanner } from '../components';
import { useFilters } from '../contexts/FilterContext';
import { useBundleData } from '../contexts/BundleDataContext';
import { useCart } from '../contexts/CartContext';
import styles from './HomePage.module.css';

/**
 * Session storage key for scroll position
 */
const SCROLL_POSITION_KEY = 'homepage-scroll-position';

/**
 * HomePage component
 * 
 * Features:
 * - Displays FilterPanel for user to filter bundles
 * - Displays BundleGrid with filtered results
 * - Handles navigation to bundle detail pages
 * - Integrates with context providers for state management
 * - Restores scroll position when navigating back (Requirement 11.5)
 */
export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { filteredBundles } = useFilters();
  const { isLoading, error } = useBundleData();
  const { addItem } = useCart();
  const bundleSectionRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  const heroSlides = useMemo(
    () => [
      {
        src: '/images/home-hero-main.jpg',
        alt: 'Happy children learning together',
        objectPosition: '50% 40%',
      },
      {
        src: '/images/home-hero-kids.jpg',
        alt: 'Kids doing playful worksheet activities',
        objectPosition: '50% 45%',
      },
      {
        src: '/images/boyreading.jpg',
        alt: 'Boy reading with joy',
        objectPosition: '50% 25%',
      },
      {
        src: '/images/girlreading.jpg',
        alt: 'Girl reading with joy',
        objectPosition: '50% 25%',
      },
    ],
    []
  );

  const displayedBundles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return filteredBundles;
    }

    return filteredBundles.filter((bundle) => {
      const nameMatch = bundle.name.toLowerCase().includes(query);
      const skillMatch = bundle.skills.some((skill) => skill.toLowerCase().includes(query));
      const ageMatch = bundle.ageRange.toLowerCase().includes(query);
      return nameMatch || skillMatch || ageMatch;
    });
  }, [filteredBundles, searchQuery]);

  /**
   * Restore scroll position when component mounts
   * This handles the case when user navigates back from detail page
   * Requirement 11.5: Maintain scroll position when navigating back
   */
  useEffect(() => {
    // Only restore scroll position if we're coming back from a detail page
    // Check if location state indicates we should restore scroll
    const shouldRestore = location.state?.restoreScroll === true;
    
    if (shouldRestore) {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        // Use setTimeout to ensure DOM is fully rendered before scrolling
        setTimeout(() => {
          window.scrollTo(0, position);
        }, 0);
      }
    }
  }, [location.state]);

  /**
   * Save scroll position before navigating away
   * This ensures we can restore it when user comes back
   */
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
    };

    // Save scroll position on scroll events
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5200);

    return () => window.clearInterval(tick);
  }, [heroSlides.length]);

  /**
   * Handle bundle card click - navigate to detail page
   * Save scroll position before navigation (Requirement 11.5)
   */
  const handleBundleClick = (bundleId: string) => {
    // Save current scroll position
    sessionStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString());
    
    // Navigate to detail page
    navigate(`/bundle/${bundleId}`);
  };

  return (
    <div className={styles.homePage}>
      <div className={styles.floatingScene} aria-hidden="true">
        <span className={`${styles.floatItem} ${styles.floatStar}`} />
        <span className={`${styles.floatItem} ${styles.floatRocket}`}>
          <svg viewBox="0 0 64 64" className={styles.floatSvg}>
            <path d="M42 8c-8 2-15 9-18 18l-8 8 6 6 8-8c9-3 16-10 18-18 1-3-3-7-6-6z" fill="#ff7b7b" />
            <circle cx="36" cy="20" r="5" fill="#d5f4ff" />
            <path d="M14 44l6 6-10 4z" fill="#ffaa4d" />
            <path d="M24 36l4 4-8 8-4-4z" fill="#4dc5ff" />
          </svg>
        </span>
        <span className={`${styles.floatItem} ${styles.floatPlanet}`}>
          <span className={styles.planetSpotOne} />
          <span className={styles.planetSpotTwo} />
          <span className={styles.planetSpotThree} />
        </span>
        <span className={`${styles.floatItem} ${styles.floatSpark}`} />
        <span className={`${styles.floatItem} ${styles.floatBubble}`} />
        <span className={`${styles.floatItem} ${styles.floatComet}`} />
      </div>

      <section className={styles.heroSplash} aria-label="MiniMinds Introduction">
        <div className={styles.heroText}>
          <p className={styles.heroBadge}>For kids ages 2 to 6</p>
          <h1 className={styles.heroTitle}>
            Make daily learning playful with printable worksheet bundles.
          </h1>
          <p className={styles.heroDescription}>
            Pick skill-based packs, add to cart, and choose instant PDF delivery or printed doorstep shipping.
          </p>
          <div className={styles.heroKpis} aria-label="Highlights">
            <div className={styles.kpiPill}>
              <span className={styles.kpiTitle}>Instant PDF</span>
              <span className={styles.kpiSub}>Download after payment</span>
            </div>
            <div className={styles.kpiPill}>
              <span className={styles.kpiTitle}>Print Option</span>
              <span className={styles.kpiSub}>Delivery to your address</span>
            </div>
            <div className={styles.kpiPill}>
              <span className={styles.kpiTitle}>Skill Packs</span>
              <span className={styles.kpiSub}>Tracing, math, logic</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.heroCta}
            onClick={() => bundleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            Explore Bundles
          </button>
        </div>

        <div className={styles.heroArt}>
          <div className={styles.heroCarousel} role="region" aria-label="MiniMinds preview carousel">
            <div className={styles.carouselFrame}>
              <div
                className={styles.carouselTrack}
                style={{ transform: `translateX(-${heroIndex * 100}%)` }}
              >
                {heroSlides.map((slide) => (
                  <div key={slide.src} className={styles.carouselSlide}>
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      className={styles.carouselImage}
                      style={{ objectPosition: slide.objectPosition }}
                      loading={slide.src.endsWith('home-hero-main.jpg') ? 'eager' : 'lazy'}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.carouselShine} aria-hidden="true" />
            </div>
            <div className={styles.carouselDots} role="tablist" aria-label="Carousel slides">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  className={index === heroIndex ? styles.dotActive : styles.dot}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-pressed={index === heroIndex}
                  onClick={() => setHeroIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.megaWrap}>
        <MegaBundleBanner />
      </div>

      <section className={styles.playStrip} aria-label="Learning Highlights">
        <div className={`${styles.playCard} ${styles.revealItem}`}>
          <span className={styles.playIcon}>Ages 2-6</span>
          <p>Curriculum-aligned worksheets for every preschool stage.</p>
        </div>
        <div className={`${styles.playCard} ${styles.revealItem}`}>
          <span className={styles.playIcon}>PDF + Print</span>
          <p>Choose instant downloads or doorstep print delivery.</p>
        </div>
        <div className={`${styles.playCard} ${styles.revealItem}`}>
          <span className={styles.playIcon}>Daily Plan</span>
          <p>Short 15-20 minute activities built for consistency.</p>
        </div>
      </section>

      <section className={styles.storySection} aria-label="Why parents love MiniMinds">
        <header className={styles.storyHeader}>
          <h2 className={styles.storyTitle}>A tiny routine that actually sticks</h2>
          <p className={styles.storySubtitle}>
            Short activities, clear progression, and bundles that feel like a game.
          </p>
        </header>
        <div className={styles.storyGrid}>
          <article className={styles.storyCard}>
            <img
              src="/images/readytostudy.jpg"
              alt="Kids ready to study"
              className={styles.storyImage}
              style={{ objectPosition: '50% 35%' }}
              loading="lazy"
            />
            <h3 className={styles.storyCardTitle}>15 minutes a day</h3>
            <p className={styles.storyCardBody}>Keep it light, consistent, and confidence-building.</p>
          </article>
          <article className={styles.storyCard}>
            <img
              src="/images/boywithstackofbooks.jpg"
              alt="Boy with a stack of books"
              className={styles.storyImage}
              style={{ objectPosition: '50% 25%' }}
              loading="lazy"
            />
            <h3 className={styles.storyCardTitle}>Printable or delivered</h3>
            <p className={styles.storyCardBody}>Instant PDF access, or choose print + shipping at checkout.</p>
          </article>
          <article className={styles.storyCard}>
            <img
              src="/images/girlwithstackofbooks.jpg"
              alt="Girl with a stack of books"
              className={styles.storyImage}
              style={{ objectPosition: '50% 25%' }}
              loading="lazy"
            />
            <h3 className={styles.storyCardTitle}>Progress you can see</h3>
            <p className={styles.storyCardBody}>Skills improve week by week: tracing, math, logic, and more.</p>
          </article>
        </div>
      </section>

      <div className={styles.container} ref={bundleSectionRef}>
        <aside className={styles.sidebar}>
          <FilterPanel />
        </aside>

        <section className={styles.content}>
          <div className={styles.contentHeader}>
            <div>
              <h1 className={styles.title}>Find the Perfect Learning Bundle</h1>
              <p className={styles.subtitle}>Pick an age group, explore skills, then checkout in minutes.</p>
              <div className={styles.quickPills} role="group" aria-label="Quick age filters">
                {['2-4', '4-6'].map((age) => (
                  <button
                    key={age}
                    type="button"
                    className={styles.quickPill}
                    onClick={() => setSearchQuery(age)}
                  >
                    Age {age}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.searchWrap}>
              <label htmlFor="bundle-search" className={styles.searchLabel}>
                Search bundles
              </label>
              <input
                id="bundle-search"
                type="search"
                className={styles.searchInput}
                placeholder="Try: tracing, numbers, 4-5"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <p className={styles.resultMeta}>{displayedBundles.length} matching bundles</p>
            </div>
          </div>
          <BundleGrid
            bundles={displayedBundles}
            isLoading={isLoading}
            error={error}
            onBundleClick={handleBundleClick}
            onAddToCart={addItem}
          />
        </section>
      </div>
    </div>
  );
}
