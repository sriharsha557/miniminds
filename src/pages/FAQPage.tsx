/**
 * FAQPage Component
 *
 * Frequently Asked Questions page with expandable accordion items.
 */

import { useState } from 'react';
import styles from './FAQPage.module.css';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What age groups are your worksheets designed for?',
    answer:
      'Our worksheets are designed for children aged 2-6 years. Each bundle is clearly labeled with the appropriate age range (2-3, 3-4, 4-5, or 5-6 years) to help you choose the right materials for your child\'s developmental stage.',
  },
  {
    question: 'How do I download the worksheets after purchase?',
    answer:
      'After completing your purchase, you\'ll receive an instant download link via email. You can also access your purchased bundles from your account dashboard. All worksheets are delivered as high-quality PDF files that you can print at home.',
  },
  {
    question: 'Can I print the worksheets multiple times?',
    answer:
      'Yes! Once you purchase a bundle, you have lifetime access and can print the worksheets as many times as you need. This is perfect for practice sessions or if you have multiple children.',
  },
  {
    question: 'What paper size should I use for printing?',
    answer:
      'Our worksheets are designed to be printed on standard A4 or US Letter (8.5" x 11") paper. We recommend using regular printer paper for daily practice, or cardstock for activities you want to laminate and reuse.',
  },
  {
    question: 'Are the free bundles really free?',
    answer:
      'Absolutely! Our free bundles are 100% free with no hidden charges. We believe every child should have access to quality learning materials. Free bundles include full-featured worksheets, just like our premium offerings.',
  },
  {
    question: 'What skills do your worksheets cover?',
    answer:
      'Our worksheets cover five key learning areas: Alphabet (letter recognition and phonics), Numbers (counting and basic math), Shapes/Colors (visual recognition), Tracing (fine motor skills and handwriting prep), and Logical Thinking (patterns, sequencing, and problem-solving).',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'Due to the digital nature of our products, we generally don\'t offer refunds once a download has been accessed. However, if you\'re unsatisfied with your purchase, please contact us at support@miniminds.com and we\'ll work with you to find a solution.',
  },
  {
    question: 'Can I use these worksheets in my school or learning center?',
    answer:
      'Yes! Our worksheets are perfect for schools, preschools, daycare centers, and homeschool co-ops. For institutional licensing or bulk purchases, please contact us at support@miniminds.com for special pricing.',
  },
  {
    question: 'What is the Mega Bundle offer?',
    answer:
      'Our Mega Bundle is our best value offer! For just ₹199, you get access to over 10,000 worksheets covering all age groups and skill areas. It\'s perfect for parents who want a complete learning library or educators who need comprehensive resources.',
  },
  {
    question: 'How often do you add new worksheets?',
    answer:
      'We regularly update our collection with new worksheets and bundles. Mega Bundle customers get automatic access to all new additions at no extra cost. Follow us on social media or subscribe to our newsletter to stay updated!',
  },
];

export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Frequently Asked Questions</h1>
        <p className={styles.subtitle}>
          Find answers to common questions about MiniMinds worksheets
        </p>

        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`${styles.faqItem} ${openIndex === index ? styles.open : ''}`}
            >
              <button
                className={styles.faqQuestion}
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span>{faq.question}</span>
                <span className={styles.faqIcon}>
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              <div
                id={`faq-answer-${index}`}
                className={styles.faqAnswer}
                role="region"
                aria-hidden={openIndex !== index}
              >
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Still have questions?</h2>
          <p className={styles.ctaText}>
            Can't find what you're looking for? We're here to help!
          </p>
          <a href="/contact" className={styles.ctaButton}>
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
