/**
 * ContactPage Component
 *
 * Contact information page with email and support hours.
 */

import styles from './ContactPage.module.css';
import { useLocation } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { submitContactMessage } from '../utils/api';

type SubmitState = 'idle' | 'submitting' | 'success' | 'fallback';

export function ContactPage() {
  const location = useLocation();
  const inquiryType = (location.state as { inquiryType?: string } | null)?.inquiryType;

  const defaultMessage =
    inquiryType === 'mega-bundle'
      ? 'Hi MiniMinds team, I am interested in the Mega Bundle offer. Please share the next steps.'
      : '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(defaultMessage);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitState('submitting');
    setStatusMessage('');

    const result = await submitContactMessage({
      name,
      email,
      message,
      inquiryType,
    });

    if (result.delivered) {
      setSubmitState('success');
      setStatusMessage('Your message was sent successfully. Our team will contact you soon.');
      setName('');
      setEmail('');
      setMessage('');
      return;
    }

    const subject = encodeURIComponent('MiniMinds Support Request');
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:support@miniminds.com?subject=${subject}&body=${body}`;
    setSubmitState('fallback');
    setStatusMessage('Backend is unavailable right now. We opened your email client as fallback.');
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Contact Us</h1>
        <p className={styles.subtitle}>
          We'd love to hear from you! Reach out with any questions or feedback.
        </p>

        <div className={styles.contactCards}>
          {/* Email Card */}
          <div className={styles.card}>
            <div className={styles.cardIcon}>📧</div>
            <h2 className={styles.cardTitle}>Email Us</h2>
            <a href="mailto:support@miniminds.com" className={styles.cardLink}>
              support@miniminds.com
            </a>
            <p className={styles.cardDescription}>
              We typically respond within 24 hours
            </p>
          </div>

          {/* Support Hours Card */}
          <div className={styles.card}>
            <div className={styles.cardIcon}>🕐</div>
            <h2 className={styles.cardTitle}>Support Hours</h2>
            <p className={styles.cardHighlight}>9:00 AM - 9:00 PM</p>
            <p className={styles.cardDescription}>
              Monday to Saturday (IST)
            </p>
          </div>

          {/* Location Card */}
          <div className={styles.card}>
            <div className={styles.cardIcon}>📍</div>
            <h2 className={styles.cardTitle}>Based In</h2>
            <p className={styles.cardHighlight}>India</p>
            <p className={styles.cardDescription}>
              Serving families worldwide
            </p>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>Send Us a Message</h2>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>Your Name</label>
              <input
                type="text"
                id="name"
                className={styles.input}
                placeholder="Enter your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                type="email"
                id="email"
                className={styles.input}
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>Message</label>
              <textarea
                id="message"
                className={styles.textarea}
                placeholder="How can we help you?"
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
              />
            </div>

            <button type="submit" className={styles.submitButton} disabled={submitState === 'submitting'}>
              {submitState === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>
            {statusMessage && (
              <p
                className={`${styles.formStatus} ${
                  submitState === 'success' ? styles.formStatusSuccess : styles.formStatusFallback
                }`}
                role="status"
              >
                {statusMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
