import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const PORT = Number(process.env.PORT || 8000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const ASSET_BASE_URL = process.env.ASSET_BASE_URL || FRONTEND_ORIGIN;
const PUBLIC_API_BASE_URL = process.env.PUBLIC_API_BASE_URL || '';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

const app = express();
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      if (req.originalUrl.startsWith('/api/payments/webhook/')) {
        req.rawBody = buf.toString('utf8');
      }
    },
  })
);

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return supabase;
}

function timingSafeEqualHex(actualHex, expectedHex) {
  if (!actualHex || !expectedHex) {
    return false;
  }
  try {
    const a = Buffer.from(actualHex, 'hex');
    const b = Buffer.from(expectedHex, 'hex');
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function hashSha256Hex(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function verifyStripeSignature(rawBody, signatureHeader, webhookSecret) {
  if (!rawBody || !signatureHeader || !webhookSecret) {
    return { ok: false, reason: 'missing_signature_input' };
  }

  const parts = signatureHeader
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const v1 = parts.find((part) => part.startsWith('v1='))?.slice(3);

  if (!timestamp || !v1) {
    return { ok: false, reason: 'invalid_signature_header' };
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');
  const matched = timingSafeEqualHex(v1, expected);
  if (!matched) {
    return { ok: false, reason: 'signature_mismatch' };
  }

  const toleranceSeconds = 5 * 60;
  const timestampMs = Number(timestamp) * 1000;
  if (!Number.isFinite(timestampMs)) {
    return { ok: false, reason: 'invalid_timestamp' };
  }
  const ageSeconds = Math.abs(Date.now() - timestampMs) / 1000;
  if (ageSeconds > toleranceSeconds) {
    return { ok: false, reason: 'timestamp_out_of_tolerance' };
  }

  return { ok: true };
}

function verifyRazorpayWebhookSignature(rawBody, signatureHeader, webhookSecret) {
  if (!rawBody || !signatureHeader || !webhookSecret) {
    return false;
  }
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return timingSafeEqualHex(signatureHeader, expected);
}

async function rpc(name, payload) {
  const sb = ensureSupabase();
  const { data, error } = await sb.rpc(name, payload);
  if (error) {
    throw new Error(`${name} failed: ${error.message}`);
  }
  return data;
}

async function getOrderContext(orderId) {
  const sb = ensureSupabase();
  const { data: order, error: orderErr } = await sb.from('orders').select('*').eq('id', orderId).single();
  if (orderErr) {
    if (orderErr.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Order lookup failed: ${orderErr.message}`);
  }

  const [{ data: customer, error: customerErr }, { data: items, error: itemsErr }] = await Promise.all([
    sb.from('customers').select('full_name,email,phone').eq('id', order.customer_id).single(),
    sb.from('order_items').select('bundle_id,bundle_name_snapshot,unit_price,quantity').eq('order_id', order.id),
  ]);

  if (customerErr) {
    throw new Error(`Customer lookup failed: ${customerErr.message}`);
  }
  if (itemsErr) {
    throw new Error(`Order items lookup failed: ${itemsErr.message}`);
  }

  return { order, customer, items: items || [] };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'miniminds-api',
    storage: supabase ? 'supabase' : 'unconfigured',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/contact', (_req, res) => {
  res.status(202).json({ ok: true, accepted: true });
});

app.post('/api/email-capture', (_req, res) => {
  res.status(202).json({ ok: true, accepted: true });
});

app.post('/api/orders', async (req, res) => {
  try {
    const { itemIds, fulfillment, customer, paymentMethod } = req.body || {};
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'itemIds is required' });
    }
    if (!fulfillment || !['pdf', 'print'].includes(fulfillment.mode)) {
      return res.status(400).json({ error: 'fulfillment.mode must be pdf or print' });
    }
    if (!customer?.fullName || !customer?.email) {
      return res.status(400).json({ error: 'customer details are incomplete' });
    }

    const data = await rpc('mm_create_checkout_order', {
      p_customer_email: customer.email,
      p_customer_name: customer.fullName,
      p_customer_phone: customer.phone || null,
      p_user_id: null,
      p_fulfillment_mode: fulfillment.mode,
      p_payment_method: paymentMethod || 'upi',
      p_item_ids: itemIds,
      p_shipping: fulfillment.mode === 'print' ? fulfillment.shippingAddress || null : null,
      p_notes: null,
      p_metadata: { source: 'checkout_page' },
    });

    return res.status(201).json({
      orderId: data.orderId,
      order: {
        id: data.orderId,
        amounts: data.amounts,
      },
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.post('/api/payments/session', async (req, res) => {
  try {
    const { orderId, provider } = req.body || {};
    if (!orderId || !provider) {
      return res.status(400).json({ error: 'orderId and provider are required' });
    }

    const context = await getOrderContext(orderId);
    if (!context) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { order, customer, items } = context;
    const successBase = `${FRONTEND_ORIGIN}/payment/success?orderId=${encodeURIComponent(order.id)}&provider=${encodeURIComponent(provider)}`;

    if (provider === 'stripe' && STRIPE_SECRET_KEY) {
      const body = new URLSearchParams();
      body.set('mode', 'payment');
      body.set('success_url', `${successBase}&session_id={CHECKOUT_SESSION_ID}`);
      body.set('cancel_url', `${FRONTEND_ORIGIN}/checkout`);
      body.set('metadata[orderId]', order.id);
      body.set('client_reference_id', order.id);

      items.forEach((item, index) => {
        body.set(`line_items[${index}][quantity]`, String(item.quantity || 1));
        body.set(`line_items[${index}][price_data][currency]`, 'inr');
        body.set(`line_items[${index}][price_data][unit_amount]`, String(Math.round(Number(item.unit_price || 0) * 100)));
        body.set(`line_items[${index}][price_data][product_data][name]`, item.bundle_name_snapshot);
      });

      let extraIndex = items.length;
      if (Number(order.printing_fee || 0) > 0) {
        body.set(`line_items[${extraIndex}][quantity]`, '1');
        body.set(`line_items[${extraIndex}][price_data][currency]`, 'inr');
        body.set(`line_items[${extraIndex}][price_data][unit_amount]`, String(Math.round(Number(order.printing_fee) * 100)));
        body.set(`line_items[${extraIndex}][price_data][product_data][name]`, 'Printing Fee');
        extraIndex += 1;
      }
      if (Number(order.shipping_fee || 0) > 0) {
        body.set(`line_items[${extraIndex}][quantity]`, '1');
        body.set(`line_items[${extraIndex}][price_data][currency]`, 'inr');
        body.set(`line_items[${extraIndex}][price_data][unit_amount]`, String(Math.round(Number(order.shipping_fee) * 100)));
        body.set(`line_items[${extraIndex}][price_data][product_data][name]`, 'Shipping Fee');
      }

      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const stripeData = await stripeResponse.json();
      if (!stripeResponse.ok || !stripeData?.id || !stripeData?.url) {
        console.error('Stripe session error:', stripeData);
        return res.status(502).json({ error: 'Stripe session creation failed' });
      }

      return res.json({
        provider: 'stripe',
        mode: 'redirect',
        checkoutUrl: stripeData.url,
        orderId: order.id,
      });
    }

    if (provider === 'razorpay' && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const rpBody = {
        amount: Math.round(Number(order.total_amount || 0) * 100),
        currency: order.currency || 'INR',
        receipt: order.id,
        notes: { orderId: order.id },
      };

      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const rpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rpBody),
      });

      const rpData = await rpResponse.json();
      if (!rpResponse.ok || !rpData?.id) {
        console.error('Razorpay order error:', rpData);
        return res.status(502).json({ error: 'Razorpay order creation failed' });
      }

      return res.json({
        provider: 'razorpay',
        mode: 'popup',
        razorpay: {
          key: RAZORPAY_KEY_ID,
          amount: rpData.amount,
          currency: rpData.currency,
          orderId: rpData.id,
          name: 'MiniMinds',
          description: `Order ${order.id}`,
          prefill: {
            name: customer.full_name,
            email: customer.email,
            contact: customer.phone || '',
          },
          notes: {
            orderId: order.id,
          },
        },
        orderId: order.id,
      });
    }

    await rpc('mm_mark_order_paid_and_provision', {
      p_order_id: order.id,
      p_provider: provider,
      p_gateway_payment_id: `mock_${crypto.randomBytes(6).toString('hex')}`,
      p_raw_payload: { source: 'mock_session' },
    });

    return res.json({
      provider,
      mode: 'redirect',
      checkoutUrl: `${successBase}&mock=1`,
      orderId: order.id,
      mock: true,
    });
  } catch (error) {
    console.error('Payment session failed:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { orderId, provider, gatewayPaymentId, gatewayOrderId, gatewaySessionId } = req.body || {};
    if (!orderId || !provider) {
      return res.status(400).json({ error: 'orderId and provider are required' });
    }

    const result = await rpc('mm_mark_order_paid_and_provision', {
      p_order_id: orderId,
      p_provider: provider,
      p_gateway_payment_id: gatewayPaymentId || null,
      p_gateway_order_id: gatewayOrderId || null,
      p_gateway_session_id: gatewaySessionId || null,
      p_raw_payload: { source: 'frontend_confirm' },
    });

    return res.json({ ok: true, orderId: result.orderId, status: result.status });
  } catch (error) {
    console.error('Payment confirm failed:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.post('/api/payments/webhook/stripe', async (req, res) => {
  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' });
    }

    const signature = req.get('stripe-signature');
    const rawBody = req.rawBody || '';
    const verification = verifyStripeSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    if (!verification.ok) {
      return res.status(400).json({ error: `Invalid Stripe signature: ${verification.reason}` });
    }

    const event = req.body || {};
    await rpc('mm_record_webhook_event', {
      p_provider: 'stripe',
      p_provider_event_id: event.id || `stripe_${hashSha256Hex(rawBody).slice(0, 20)}`,
      p_event_type: event.type || 'unknown',
      p_signature_valid: true,
      p_payload: event,
    });

    if (event.type === 'checkout.session.completed') {
      const metadataOrderId = event?.data?.object?.metadata?.orderId || event?.data?.object?.client_reference_id || null;
      if (metadataOrderId) {
        await rpc('mm_mark_order_paid_and_provision', {
          p_order_id: metadataOrderId,
          p_provider: 'stripe',
          p_gateway_session_id: event?.data?.object?.id || null,
          p_gateway_payment_id: event?.data?.object?.payment_intent || null,
          p_provider_event_id: event.id || null,
          p_raw_payload: event,
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook failed:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.post('/api/payments/webhook/razorpay', async (req, res) => {
  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'RAZORPAY_WEBHOOK_SECRET is not configured' });
    }

    const signature = req.get('x-razorpay-signature');
    const rawBody = req.rawBody || '';
    const valid = verifyRazorpayWebhookSignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid Razorpay signature' });
    }

    const event = req.body || {};
    const eventName = event?.event || '';
    const paymentEntity = event?.payload?.payment?.entity || {};
    const orderEntity = event?.payload?.order?.entity || {};
    const providerEventId = paymentEntity?.id || orderEntity?.id || `rzp_${hashSha256Hex(rawBody).slice(0, 20)}`;

    await rpc('mm_record_webhook_event', {
      p_provider: 'razorpay',
      p_provider_event_id: providerEventId,
      p_event_type: eventName || 'unknown',
      p_signature_valid: true,
      p_payload: event,
    });

    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      const orderIdFromNotes = paymentEntity?.notes?.orderId || orderEntity?.notes?.orderId || null;
      const orderIdFromReceipt = orderEntity?.receipt || null;
      const matchedId = orderIdFromNotes || orderIdFromReceipt;

      if (matchedId) {
        await rpc('mm_mark_order_paid_and_provision', {
          p_order_id: matchedId,
          p_provider: 'razorpay',
          p_gateway_order_id: orderEntity?.id || paymentEntity?.order_id || null,
          p_gateway_payment_id: paymentEntity?.id || null,
          p_provider_event_id: providerEventId,
          p_raw_payload: event,
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook failed:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.get('/api/orders/:orderId/success', async (req, res) => {
  try {
    const { orderId } = req.params;
    const apiBase = PUBLIC_API_BASE_URL || `${req.protocol}://${req.get('host')}`;

    const payload = await rpc('mm_get_order_success_payload', {
      p_order_id: orderId,
      p_include_download_tokens: true,
      p_token_ttl_days: 30,
      p_api_base_url: apiBase,
    });

    return res.json({
      ...payload,
      amounts: {
        ...payload.amounts,
        gst: payload.amounts?.tax ?? payload.amounts?.gst ?? 0,
      },
    });
  } catch (error) {
    console.error('Order success fetch failed:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.get('/api/download/:token', async (req, res) => {
  try {
    const sb = ensureSupabase();
    const { token } = req.params;
    const tokenHash = hashSha256Hex(token);

    const { data: entitlement, error: entErr } = await sb
      .from('download_entitlements')
      .select('id,order_id,order_item_id,is_revoked,expires_at,download_count,max_downloads')
      .eq('token_hash', tokenHash)
      .single();

    if (entErr || !entitlement) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    if (entitlement.is_revoked) {
      return res.status(410).json({ error: 'Download token revoked' });
    }
    if (entitlement.expires_at && new Date(entitlement.expires_at).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Download token expired' });
    }
    if ((entitlement.download_count || 0) >= (entitlement.max_downloads || 1)) {
      return res.status(429).json({ error: 'Download limit reached' });
    }

    const [{ data: order, error: orderErr }, { data: item, error: itemErr }] = await Promise.all([
      sb.from('orders').select('status,fulfillment_mode').eq('id', entitlement.order_id).single(),
      sb.from('order_items').select('bundle_id').eq('id', entitlement.order_item_id).single(),
    ]);

    if (orderErr || !order || order.status !== 'paid' || order.fulfillment_mode !== 'pdf') {
      return res.status(404).json({ error: 'Invalid order state for download' });
    }
    if (itemErr || !item) {
      return res.status(404).json({ error: 'Bundle not found for entitlement' });
    }

    const { data: bundle, error: bundleErr } = await sb
      .from('bundle_catalog')
      .select('pdf_storage_path')
      .eq('id', item.bundle_id)
      .single();

    if (bundleErr || !bundle?.pdf_storage_path) {
      return res.status(404).json({ error: 'File unavailable' });
    }

    await sb
      .from('download_entitlements')
      .update({
        download_count: Number(entitlement.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq('id', entitlement.id);

    const target = new URL(bundle.pdf_storage_path, ASSET_BASE_URL).toString();
    return res.redirect(target);
  } catch (error) {
    console.error('Download token failed:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled API error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`MiniMinds API running on http://localhost:${PORT}`);
  if (!supabase) {
    console.warn('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
});
