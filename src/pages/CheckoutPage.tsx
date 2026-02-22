import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBundleData } from '../contexts/BundleDataContext';
import { useCart, type CartItem } from '../contexts/CartContext';
import {
  type FulfillmentMode,
  type PaymentMethod,
  type PaymentProvider,
  confirmPayment,
  createOrder,
  createPaymentSession,
} from '../utils/checkoutApi';
import styles from './CheckoutPage.module.css';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  subtitle: string;
}

interface ProviderOption {
  id: PaymentProvider;
  title: string;
  subtitle: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'upi', title: 'UPI', subtitle: 'Google Pay, PhonePe, Paytm and other UPI apps' },
  { id: 'card', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay, Amex' },
  { id: 'netbanking', title: 'Net Banking', subtitle: 'All major Indian banks' },
  { id: 'wallet', title: 'Wallets', subtitle: 'Paytm Wallet, Mobikwik and others' },
];

const PROVIDER_OPTIONS: ProviderOption[] = [
  { id: 'razorpay', title: 'Razorpay', subtitle: 'Best for INR UPI/cards/net banking flow' },
  { id: 'stripe', title: 'Stripe', subtitle: 'Global checkout and cards flow' },
];

function getInitialProvider(): PaymentProvider {
  const configured = (import.meta.env.VITE_DEFAULT_PAYMENT_PROVIDER as string | undefined)?.trim().toLowerCase();
  if (configured === 'stripe') {
    return 'stripe';
  }
  return 'razorpay';
}

function asCartItem(bundle: {
  id: string;
  name: string;
  price?: number;
  coverImageUrl: string;
  worksheetCount: number;
  ageRange: string;
}): CartItem {
  return {
    bundleId: bundle.id,
    name: bundle.name,
    price: bundle.price ?? 0,
    coverImageUrl: bundle.coverImageUrl,
    worksheetCount: bundle.worksheetCount,
    ageRange: bundle.ageRange,
  };
}

export function CheckoutPage() {
  const { bundleId } = useParams();
  const navigate = useNavigate();
  const { bundles, isLoading, error } = useBundleData();
  const { items, removeItem, clearCart } = useCart();

  const directBundle = bundles.find((item) => item.id === bundleId);
  const checkoutItems = useMemo(() => {
    if (bundleId) {
      if (!directBundle || directBundle.isFree) {
        return [];
      }
      return [asCartItem(directBundle)];
    }
    return items;
  }, [bundleId, directBundle, items]);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [provider, setProvider] = useState<PaymentProvider>(getInitialProvider());
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>('pdf');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const pricing = useMemo(() => {
    const subtotal = checkoutItems.reduce((sum, item) => sum + item.price, 0);
    const printCost = fulfillmentMode === 'print' ? checkoutItems.length * 120 : 0;
    const shipping = fulfillmentMode === 'print' ? 79 : 0;
    const taxable = subtotal + printCost + shipping;
    const gst = taxable * 0.18;
    const total = taxable + gst;
    return { subtotal, printCost, shipping, gst, total };
  }, [checkoutItems, fulfillmentMode]);

  const validateShipping = () => {
    if (fulfillmentMode !== 'print') {
      return true;
    }
    return Boolean(
      addressLine1.trim() &&
        city.trim() &&
        stateName.trim() &&
        postalCode.trim()
    );
  };

  const handleRazorpayFlow = async (
    orderId: string,
    session: Awaited<ReturnType<typeof createPaymentSession>>
  ) => {
    if (session.mode === 'redirect' && session.checkoutUrl) {
      window.location.href = session.checkoutUrl;
      return;
    }

    if (!session.razorpay) {
      throw new Error('Razorpay session response is incomplete.');
    }

    if (!window.Razorpay) {
      await confirmPayment({ orderId, provider: 'razorpay', gatewayOrderId: session.razorpay.orderId });
      if (!bundleId) {
        clearCart();
      }
      navigate(`/payment/success?orderId=${encodeURIComponent(orderId)}&provider=razorpay`);
      return;
    }

    const razorpay = new window.Razorpay({
      ...session.razorpay,
      handler: async (response: Record<string, unknown>) => {
        await confirmPayment({
          orderId,
          provider: 'razorpay',
          gatewayOrderId: String(response.razorpay_order_id || ''),
          gatewayPaymentId: String(response.razorpay_payment_id || ''),
        });
        if (!bundleId) {
          clearCart();
        }
        navigate(`/payment/success?orderId=${encodeURIComponent(orderId)}&provider=razorpay`);
      },
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          setStatusMessage('Payment was cancelled. You can try again.');
        },
      },
    });
    razorpay.open();
  };

  const handlePayNow = async () => {
    if (checkoutItems.length === 0) {
      setStatusMessage('Your cart is empty. Add at least one paid bundle to continue.');
      return;
    }
    if (!fullName.trim() || !email.trim() || !phone.trim() || !acceptTerms) {
      setStatusMessage('Please complete your details and accept terms before proceeding.');
      return;
    }
    if (!validateShipping()) {
      setStatusMessage('Please complete all shipping fields for print and delivery orders.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('');

    try {
      const order = await createOrder({
        itemIds: checkoutItems.map((item) => item.bundleId),
        customer: { fullName, email, phone },
        paymentMethod: selectedMethod,
        fulfillment: {
          mode: fulfillmentMode,
          shippingAddress:
            fulfillmentMode === 'print'
              ? { addressLine1, city, state: stateName, postalCode }
              : undefined,
        },
      });

      const session = await createPaymentSession({ orderId: order.orderId, provider });

      if (provider === 'stripe') {
        if (!session.checkoutUrl) {
          throw new Error('Stripe checkout URL is missing.');
        }
        if (session.mock && !bundleId) {
          clearCart();
        }
        window.location.href = session.checkoutUrl;
        return;
      }

      await handleRazorpayFlow(order.orderId, session);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start payment. Please try again.';
      setStatusMessage(message);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className={styles.state}>Loading checkout...</div>;
  }

  if (error) {
    return (
      <div className={styles.stateError} role="alert">
        Unable to load checkout. Please go back and try again.
      </div>
    );
  }

  if (bundleId && !directBundle) {
    return (
      <div className={styles.stateError} role="alert">
        Selected bundle was not found.
      </div>
    );
  }

  if (bundleId && directBundle?.isFree) {
    return (
      <div className={styles.state}>
        This is a free bundle. You can download it directly from the bundle details page.
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className={styles.state}>
        <p>Your cart is empty.</p>
        <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
          Browse Bundles
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
          Continue Shopping
        </button>

        <div className={styles.layout}>
          <section className={styles.paymentSection}>
            <h1 className={styles.title}>Secure Checkout</h1>
            <p className={styles.subtitle}>Guest checkout enabled. Choose delivery and payment gateway.</p>

            <div className={styles.billingCard}>
              <h2 className={styles.sectionHeading}>Billing Details</h2>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  Full Name
                  <input
                    className={styles.input}
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </label>
                <label className={styles.field}>
                  Email
                  <input
                    className={styles.input}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </label>
                <label className={styles.field}>
                  Phone Number
                  <input
                    className={styles.input}
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Enter phone number"
                    autoComplete="tel"
                  />
                </label>
              </div>
            </div>

            <h2 className={styles.sectionHeading}>Delivery Preference</h2>
            <div className={styles.fulfillmentGrid}>
              <button
                type="button"
                className={`${styles.fulfillmentCard} ${fulfillmentMode === 'pdf' ? styles.fulfillmentSelected : ''}`}
                onClick={() => setFulfillmentMode('pdf')}
              >
                <strong>PDF Instant Download</strong>
                <span>Download immediately after successful payment.</span>
              </button>
              <button
                type="button"
                className={`${styles.fulfillmentCard} ${fulfillmentMode === 'print' ? styles.fulfillmentSelected : ''}`}
                onClick={() => setFulfillmentMode('print')}
              >
                <strong>Print + Delivery</strong>
                <span>We print and ship to your provided address.</span>
              </button>
            </div>

            {fulfillmentMode === 'print' && (
              <div className={styles.shippingCard}>
                <h2 className={styles.sectionHeading}>Shipping Address</h2>
                <div className={styles.fieldGrid}>
                  <label className={styles.field}>
                    Address Line 1
                    <input
                      className={styles.input}
                      type="text"
                      value={addressLine1}
                      onChange={(event) => setAddressLine1(event.target.value)}
                      placeholder="House number, street"
                      autoComplete="address-line1"
                    />
                  </label>
                  <label className={styles.field}>
                    City
                    <input
                      className={styles.input}
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      autoComplete="address-level2"
                    />
                  </label>
                  <label className={styles.field}>
                    State
                    <input
                      className={styles.input}
                      type="text"
                      value={stateName}
                      onChange={(event) => setStateName(event.target.value)}
                      autoComplete="address-level1"
                    />
                  </label>
                  <label className={styles.field}>
                    Postal Code
                    <input
                      className={styles.input}
                      type="text"
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      autoComplete="postal-code"
                    />
                  </label>
                </div>
              </div>
            )}

            <h2 className={styles.sectionHeading}>Payment Gateway</h2>
            <div className={styles.methods} role="radiogroup" aria-label="Payment gateway">
              {PROVIDER_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`${styles.methodCard} ${provider === option.id ? styles.methodCardSelected : ''}`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={option.id}
                    checked={provider === option.id}
                    onChange={() => setProvider(option.id)}
                  />
                  <div>
                    <p className={styles.methodTitle}>{option.title}</p>
                    <p className={styles.methodSubtitle}>{option.subtitle}</p>
                  </div>
                  <span className={styles.methodState}>{provider === option.id ? 'Selected' : 'Choose'}</span>
                </label>
              ))}
            </div>

            <h2 className={styles.sectionHeading}>Payment Method</h2>
            <div className={styles.methods} role="radiogroup" aria-label="Payment methods">
              {PAYMENT_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`${styles.methodCard} ${selectedMethod === option.id ? styles.methodCardSelected : ''}`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={option.id}
                    checked={selectedMethod === option.id}
                    onChange={() => setSelectedMethod(option.id)}
                  />
                  <div>
                    <p className={styles.methodTitle}>{option.title}</p>
                    <p className={styles.methodSubtitle}>{option.subtitle}</p>
                  </div>
                  <span className={styles.methodState}>{selectedMethod === option.id ? 'Selected' : 'Choose'}</span>
                </label>
              ))}
            </div>

            <div className={styles.methodHint}>
              {selectedMethod === 'upi' && 'You will be redirected to your UPI app after placing the order.'}
              {selectedMethod === 'card' && 'Card details are captured securely at the gateway page.'}
              {selectedMethod === 'netbanking' && 'You can choose your bank at the gateway step.'}
              {selectedMethod === 'wallet' && 'Supported wallets will appear on the gateway screen.'}
            </div>

            <label className={styles.terms}>
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
              />
              <span>I agree to the terms of service and refund policy.</span>
            </label>

            <button type="button" className={styles.payButton} onClick={handlePayNow} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : `Pay INR ${pricing.total.toFixed(2)}`}
            </button>

            {statusMessage && (
              <p className={styles.notice} role="status">
                {statusMessage}
              </p>
            )}
          </section>

          <aside className={styles.summarySection}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryItems}>
              {checkoutItems.map((item) => (
                <div key={item.bundleId} className={styles.bundleRow}>
                  <img src={item.coverImageUrl} alt={`${item.name} cover`} className={styles.bundleImage} />
                  <div>
                    <p className={styles.bundleName}>{item.name}</p>
                    <p className={styles.bundleMeta}>{item.worksheetCount} worksheets</p>
                    <p className={styles.bundleMeta}>Age {item.ageRange} years</p>
                    <p className={styles.bundleMeta}>INR {item.price.toFixed(2)}</p>
                    {!bundleId && (
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeItem(item.bundleId)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.priceBreakdown}>
              <div className={styles.priceLine}>
                <span>Subtotal</span>
                <span>INR {pricing.subtotal.toFixed(2)}</span>
              </div>
              {fulfillmentMode === 'print' && (
                <>
                  <div className={styles.priceLine}>
                    <span>Printing</span>
                    <span>INR {pricing.printCost.toFixed(2)}</span>
                  </div>
                  <div className={styles.priceLine}>
                    <span>Shipping</span>
                    <span>INR {pricing.shipping.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className={styles.priceLine}>
                <span>GST (18%)</span>
                <span>INR {pricing.gst.toFixed(2)}</span>
              </div>
              <div className={styles.totalLine}>
                <span>Total</span>
                <span>INR {pricing.total.toFixed(2)}</span>
              </div>
            </div>

            <p className={styles.secureNote}>256-bit SSL encrypted checkout.</p>
            <ul className={styles.trustList}>
              <li>No card details stored on MiniMinds servers</li>
              <li>Instant order confirmation after successful payment</li>
              <li>Auto-generated invoice to your email</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
