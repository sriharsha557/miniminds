import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getOrderSuccess, resolveDownloadUrl, type OrderSuccessResponse } from '../utils/checkoutApi';
import styles from './PaymentSuccessPage.module.css';

type PageState = 'loading' | 'ready' | 'error';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<OrderSuccessResponse | null>(null);
  const [error, setError] = useState<string>('');

  const orderId = searchParams.get('orderId') || '';
  const provider = searchParams.get('provider') || 'gateway';

  useEffect(() => {
    if (!orderId) return;

    let active = true;
    getOrderSuccess(orderId)
      .then((result) => {
        if (!active) {
          return;
        }
        setData(result);
        setState('ready');
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Could not load order summary.';
        setError(message);
        setState('error');
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <div className={styles.stateError} role="alert">
        <p>Missing order reference.</p>
        <Link to="/checkout" className={styles.linkButton}>
          Back to Checkout
        </Link>
      </div>
    );
  }

  if (state === 'loading') {
    return <div className={styles.state}>Loading payment confirmation...</div>;
  }

  if (state === 'error' || !data) {
    return (
      <div className={styles.stateError} role="alert">
        <p>{error || 'Unable to load payment confirmation.'}</p>
        <Link to="/checkout" className={styles.linkButton}>
          Back to Checkout
        </Link>
      </div>
    );
  }

  const isPaid = data.status === 'paid';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.hero}>
          <p className={styles.kicker}>Payment via {provider}</p>
          <h1 className={styles.title}>{isPaid ? 'Order Confirmed' : 'Payment Pending'}</h1>
          <p className={styles.subtitle}>
            Order ID: <strong>{data.orderId}</strong>
          </p>
          <p className={styles.subtitle}>
            Total Paid: <strong>INR {data.amounts.total.toFixed(2)}</strong>
          </p>
        </header>

        {data.fulfillment.mode === 'pdf' ? (
          <section className={styles.card}>
            <h2>PDF Download Access</h2>
            {data.downloads.length === 0 ? (
              <p>Download links are being prepared. Please refresh in a few moments.</p>
            ) : (
              <ul className={styles.list}>
                {data.downloads.map((download) => (
                  <li key={download.token} className={styles.listItem}>
                    <div>
                      <p className={styles.itemTitle}>{download.bundleName}</p>
                      <p className={styles.itemMeta}>
                        Token expires on {new Date(download.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <a
                      className={styles.linkButton}
                      href={resolveDownloadUrl(download.downloadUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download PDF
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className={styles.card}>
            <h2>Print + Delivery Status</h2>
            <p>
              Tracking ID:{' '}
              <strong>{data.tracking?.trackingId ?? 'Will be assigned shortly'}</strong>
            </p>
            <p>Status: {data.tracking?.status ?? 'processing'}</p>
            <p>Estimated delivery: {data.tracking?.etaDays ?? '5-7'} business days</p>
          </section>
        )}

        <section className={styles.card}>
          <h2>What next?</h2>
          <ul className={styles.bulletList}>
            <li>Order confirmation has been sent to your email.</li>
            <li>For support, include your order ID in the contact form.</li>
            <li>You can continue shopping for more bundles anytime.</li>
          </ul>
          <Link to="/" className={styles.linkButton}>
            Back to Home
          </Link>
        </section>
      </div>
    </div>
  );
}
