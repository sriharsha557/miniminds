export type PaymentProvider = 'razorpay' | 'stripe';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet';
export type FulfillmentMode = 'pdf' | 'print';

export interface CheckoutCustomer {
  fullName: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface CreateOrderRequest {
  itemIds: string[];
  customer: CheckoutCustomer;
  paymentMethod: PaymentMethod;
  fulfillment: {
    mode: FulfillmentMode;
    shippingAddress?: ShippingAddress;
  };
}

export interface CreateOrderResponse {
  orderId: string;
  order: {
    id: string;
    amounts: {
      total: number;
      subtotal: number;
      gst: number;
      printing: number;
      shipping: number;
      currency: string;
    };
  };
}

export interface PaymentSessionResponse {
  provider: PaymentProvider;
  mode: 'redirect' | 'popup';
  checkoutUrl?: string;
  orderId: string;
  mock?: boolean;
  razorpay?: {
    key: string;
    amount: number;
    currency: string;
    orderId: string;
    name: string;
    description: string;
    prefill: {
      name: string;
      email: string;
      contact: string;
    };
    notes: {
      orderId: string;
    };
  };
}

export interface OrderSuccessResponse {
  orderId: string;
  status: string;
  paidAt: string | null;
  fulfillment: {
    mode: FulfillmentMode;
    shippingAddress: ShippingAddress | null;
  };
  amounts: {
    subtotal: number;
    printing: number;
    shipping: number;
    gst: number;
    total: number;
    currency: string;
  };
  items: Array<{
    bundleId: string;
    name: string;
    price: number;
  }>;
  downloads: Array<{
    bundleId: string;
    bundleName: string;
    token: string;
    expiresAt: string;
    downloadUrl: string;
  }>;
  tracking: {
    status: string;
    trackingId: string;
    etaDays: string;
    updatedAt: string;
  } | null;
}

function resolveApiUrl(defaultPath: string): string {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = defaultPath.startsWith('/') ? defaultPath.slice(1) : defaultPath;
  return new URL(normalizedPath, normalizedBase).toString();
}

async function postJson<T>(path: string, payload: object): Promise<T> {
  const url = resolveApiUrl(path);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

async function getJson<T>(path: string): Promise<T> {
  const url = resolveApiUrl(path);
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.error === 'string' ? data.error : 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export async function createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
  return postJson<CreateOrderResponse>('/api/orders', payload);
}

export async function createPaymentSession(payload: {
  orderId: string;
  provider: PaymentProvider;
}): Promise<PaymentSessionResponse> {
  return postJson<PaymentSessionResponse>('/api/payments/session', payload);
}

export async function confirmPayment(payload: {
  orderId: string;
  provider: PaymentProvider;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  gatewaySessionId?: string;
}): Promise<{ ok: boolean; orderId: string; status: string }> {
  return postJson('/api/payments/confirm', payload);
}

export async function getOrderSuccess(orderId: string): Promise<OrderSuccessResponse> {
  return getJson<OrderSuccessResponse>(`/api/orders/${encodeURIComponent(orderId)}/success`);
}

export function resolveDownloadUrl(relativePath: string): string {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!baseUrl) {
    return relativePath;
  }
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return new URL(normalizedPath, normalizedBase).toString();
}
