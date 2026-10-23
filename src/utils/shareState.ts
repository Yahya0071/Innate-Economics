/**
 * Utility for encoding and decoding simulation decision fingerprints into URL query params
 */

export function encodeDecisionState(params: Record<string, string | number | boolean>): string {
  if (typeof window === 'undefined') return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }
  const url = new URL(window.location.href);
  url.search = searchParams.toString();
  return url.toString();
}

export function decodeDecisionState(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const searchParams = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    result[key] = val;
  });
  return result;
}

export async function copyOrShareDecision(title: string, text: string, url: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  // Try Native Web Share API first (on mobile/supported browsers)
  if (navigator.share && navigator.canShare && navigator.canShare({ title, text, url })) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      // User cancelled or share failed, fallback to clipboard
    }
  }

  // Fallback to Clipboard API
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
