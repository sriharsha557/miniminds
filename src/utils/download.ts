/**
 * Formats bytes into a human readable size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

/**
 * Builds a descriptive, filesystem-safe filename from bundle name.
 */
export function buildDownloadFilename(bundleName: string): string {
  const normalized = bundleName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return `${normalized || 'worksheet-bundle'}.pdf`;
}

/**
 * Downloads a PDF from URL with a generated filename.
 */
export async function downloadBundlePdf(pdfUrl: string, bundleName: string): Promise<void> {
  const response = await fetch(pdfUrl);

  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const filename = buildDownloadFilename(bundleName);

  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
