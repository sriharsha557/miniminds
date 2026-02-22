import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DownloadButton, EmailCaptureModal, PreviewGallery } from '../components';
import { useBundleData } from '../contexts/BundleDataContext';
import { useCart } from '../contexts/CartContext';
import { downloadBundlePdf } from '../utils/download';
import { submitEmailCapture } from '../utils/api';
import styles from './BundleDetailPage.module.css';

const EMAIL_CAPTURE_SEEN_KEY = 'email-capture-seen';

export function BundleDetailPage() {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const { bundles, isLoading, error } = useBundleData();
  const { addItem, hasItem } = useCart();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const bundle = bundles.find((item) => item.id === bundleId);

  const handleBack = () => {
    navigate('/', { state: { restoreScroll: true } });
  };

  const runDownload = async () => {
    if (!bundle) {
      return;
    }

    setActionError(null);
    try {
      await downloadBundlePdf(bundle.pdfUrl, bundle.name);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not download the file right now. Please retry.';
      setActionError(message);
      throw err;
    }
  };

  const handleRequestDownload = async () => {
    if (!bundle || !bundle.isFree) {
      return;
    }

    const alreadyShown = sessionStorage.getItem(EMAIL_CAPTURE_SEEN_KEY) === 'true';
    if (!alreadyShown) {
      setIsEmailModalOpen(true);
      return;
    }

    await runDownload();
  };

  const handleRequestPurchase = () => {
    if (!bundle) {
      return;
    }

    addItem(bundle);
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    if (!bundle) {
      return;
    }

    addItem(bundle);
  };

  const handleEmailContinue = async (email: string | null) => {
    if (bundle && email) {
      const result = await submitEmailCapture({
        email,
        bundleId: bundle.id,
        bundleName: bundle.name,
      });

      if (!result.delivered) {
        console.warn('Email capture queued for retry:', result.reason);
      }
    }

    sessionStorage.setItem(EMAIL_CAPTURE_SEEN_KEY, 'true');
    setIsEmailModalOpen(false);
    await runDownload();
  };

  if (isLoading) {
    return <div className={styles.state}>Loading bundle details...</div>;
  }

  if (error) {
    return (
      <div className={styles.stateError} role="alert">
        Unable to load bundle details. Please go back and try again.
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className={styles.stateError} role="alert">
        Bundle not found.
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backButton} type="button" onClick={handleBack}>
          Back to Bundles
        </button>

        <section className={styles.hero}>
          <img src={bundle.coverImageUrl} alt={`${bundle.name} cover`} className={styles.cover} />
          <div className={styles.heroContent}>
            <h1 className={styles.title}>{bundle.name}</h1>
            <p className={styles.meta}>Age: {bundle.ageRange} years</p>
            <p className={styles.meta}>Worksheets: {bundle.worksheetCount}</p>
            <div className={styles.skills}>
              {bundle.skills.map((skill) => (
                <span key={skill} className={styles.skillTag}>
                  {skill}
                </span>
              ))}
            </div>
            <DownloadButton
              bundle={bundle}
              onRequestDownload={handleRequestDownload}
              onRequestPurchase={handleRequestPurchase}
              onAddToCart={handleAddToCart}
              isInCart={hasItem(bundle.id)}
            />
            {actionError && (
              <p className={styles.actionError} role="alert">
                {actionError}
              </p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Learning Goals</h2>
          <ul className={styles.list}>
            {bundle.learningGoals.map((goal) => (
              <li key={goal}>{goal}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Worksheet Previews</h2>
          <PreviewGallery images={bundle.previewImageUrls} bundleName={bundle.name} />
        </section>

        <section className={styles.section}>
          <h2>Printing Tips</h2>
          <ul className={styles.list}>
            {bundle.printingTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>

      <EmailCaptureModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onContinue={handleEmailContinue}
      />
    </div>
  );
}
