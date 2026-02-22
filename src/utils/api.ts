type SubmissionKind = 'contact' | 'email_capture';

interface ApiResult {
  delivered: boolean;
  queued: boolean;
  reason?: string;
}

interface ContactSubmissionPayload {
  name: string;
  email: string;
  message: string;
  inquiryType?: string;
  source: 'contact_page';
  submittedAt: string;
}

interface EmailCapturePayload {
  email: string;
  bundleId: string;
  bundleName: string;
  source: 'download_modal';
  submittedAt: string;
}

const QUEUE_STORAGE_KEY = 'miniminds-pending-submissions';

interface QueuedSubmission {
  kind: SubmissionKind;
  payload: ContactSubmissionPayload | EmailCapturePayload;
  queuedAt: string;
}

function resolveApiUrl(defaultPath: string, envPath?: string): string | null {
  const configuredPath = (envPath ?? '').trim();

  if (configuredPath.startsWith('http://') || configuredPath.startsWith('https://')) {
    return configuredPath;
  }

  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  const path = configuredPath || defaultPath;

  if (!baseUrl) {
    return null;
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;

  return new URL(normalizedPath, normalizedBase).toString();
}

function queueSubmission(kind: SubmissionKind, payload: ContactSubmissionPayload | EmailCapturePayload): void {
  try {
    const currentRaw = localStorage.getItem(QUEUE_STORAGE_KEY);
    const current = currentRaw ? (JSON.parse(currentRaw) as QueuedSubmission[]) : [];

    current.push({
      kind,
      payload,
      queuedAt: new Date().toISOString(),
    });

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(current));
  } catch (error) {
    console.error('Unable to persist queued submission:', error);
  }
}

async function postJson(url: string, payload: object): Promise<boolean> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function submitContactMessage(input: {
  name: string;
  email: string;
  message: string;
  inquiryType?: string;
}): Promise<ApiResult> {
  const payload: ContactSubmissionPayload = {
    ...input,
    source: 'contact_page',
    submittedAt: new Date().toISOString(),
  };

  const url = resolveApiUrl(
    '/api/contact',
    import.meta.env.VITE_CONTACT_API_PATH as string | undefined
  );

  if (!url) {
    queueSubmission('contact', payload);
    return { delivered: false, queued: true, reason: 'api_not_configured' };
  }

  const ok = await postJson(url, payload);
  if (ok) {
    return { delivered: true, queued: false };
  }

  queueSubmission('contact', payload);
  return { delivered: false, queued: true, reason: 'api_unavailable' };
}

export async function submitEmailCapture(input: {
  email: string;
  bundleId: string;
  bundleName: string;
}): Promise<ApiResult> {
  const payload: EmailCapturePayload = {
    ...input,
    source: 'download_modal',
    submittedAt: new Date().toISOString(),
  };

  const url = resolveApiUrl(
    '/api/email-capture',
    import.meta.env.VITE_EMAIL_CAPTURE_API_PATH as string | undefined
  );

  if (!url) {
    queueSubmission('email_capture', payload);
    return { delivered: false, queued: true, reason: 'api_not_configured' };
  }

  const ok = await postJson(url, payload);
  if (ok) {
    return { delivered: true, queued: false };
  }

  queueSubmission('email_capture', payload);
  return { delivered: false, queued: true, reason: 'api_unavailable' };
}
