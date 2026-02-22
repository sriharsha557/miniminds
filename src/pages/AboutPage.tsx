/**
 * AboutPage Component
 *
 * About Us page with company mission, values, and story.
 */

import styles from './AboutPage.module.css';

export function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.title}>About MiniMinds</h1>
          <p className={styles.tagline}>
            Nurturing Young Minds Through Creative Learning
          </p>
        </section>

        {/* Mission Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Mission</h2>
          <p className={styles.text}>
            At MiniMinds, we believe every child deserves access to quality educational
            resources. Our mission is to create engaging, age-appropriate worksheets that
            make learning fun and accessible for children aged 2-6 years. We're dedicated
            to helping parents, teachers, and caregivers nurture curious, confident learners.
          </p>
        </section>

        {/* Values Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What We Value</h2>
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <span className={styles.valueIcon}>🎯</span>
              <h3 className={styles.valueTitle}>Age-Appropriate Learning</h3>
              <p className={styles.valueText}>
                Every worksheet is carefully designed for specific age groups,
                ensuring developmentally appropriate challenges.
              </p>
            </div>

            <div className={styles.valueCard}>
              <span className={styles.valueIcon}>🎨</span>
              <h3 className={styles.valueTitle}>Creative Engagement</h3>
              <p className={styles.valueText}>
                Colorful, fun designs that capture children's attention and
                make learning an enjoyable experience.
              </p>
            </div>

            <div className={styles.valueCard}>
              <span className={styles.valueIcon}>📚</span>
              <h3 className={styles.valueTitle}>Comprehensive Coverage</h3>
              <p className={styles.valueText}>
                From alphabets to logical thinking, our bundles cover all
                essential early learning skills.
              </p>
            </div>

            <div className={styles.valueCard}>
              <span className={styles.valueIcon}>💰</span>
              <h3 className={styles.valueTitle}>Affordable Access</h3>
              <p className={styles.valueText}>
                Quality education shouldn't break the bank. We offer free
                resources and affordable premium bundles.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Story</h2>
          <p className={styles.text}>
            MiniMinds was born from a simple observation: parents and educators needed
            high-quality, printable learning materials that were both affordable and effective.
            What started as a small collection of worksheets has grown into a comprehensive
            library of over 10,000 educational resources.
          </p>
          <p className={styles.text}>
            Today, we're proud to serve thousands of families across India and beyond,
            helping little learners build strong foundations in literacy, numeracy,
            and critical thinking skills.
          </p>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>10,000+</span>
            <span className={styles.statLabel}>Worksheets</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>5,000+</span>
            <span className={styles.statLabel}>Happy Families</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>100+</span>
            <span className={styles.statLabel}>Schools</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>4.9★</span>
            <span className={styles.statLabel}>Rating</span>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Ready to Start Learning?</h2>
          <p className={styles.ctaText}>
            Explore our collection of educational worksheets and give your child
            the gift of joyful learning.
          </p>
          <a href="/" className={styles.ctaButton}>
            Browse Worksheets
          </a>
        </section>
      </div>
    </div>
  );
}
