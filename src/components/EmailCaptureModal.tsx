import { useEffect, useState, type FormEvent } from 'react';
import styles from './EmailCaptureModal.module.css';

export interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (email: string | null) => Promise<void> | void;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function EmailCaptureModal({ isOpen, onClose, onContinue }: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (email.length === 0) {
      setEmail('');
      setError(null);
      setIsSubmitting(true);
      try {
        await onContinue(null);
      } catch {
        setError('Could not continue right now. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address, or skip this step.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onContinue(email);
    } catch {
      setError('Could not continue right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setEmail('');
    setError(null);
    setIsSubmitting(true);
    try {
      await onContinue(null);
    } catch {
      setError('Could not continue right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="email-modal-title">
      <div className={styles.modal}>
        <h2 id="email-modal-title" className={styles.title}>
          Get updates on new worksheets
        </h2>
        <p className={styles.subtitle}>
          Email is optional. You can continue directly to download.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="capture-email" className={styles.label}>
            Email (optional)
          </label>
          <input
            id="capture-email"
            className={styles.input}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            disabled={isSubmitting}
          />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : 'Continue to Download'}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleSkip} disabled={isSubmitting}>
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
