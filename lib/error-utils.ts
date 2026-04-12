export function getErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again or contact support.';

  let msg = '';
  if (typeof error === 'string') msg = error;
  else if (error instanceof Error) msg = error.message || '';
  else if (isErrorWithMessage(error)) msg = String(error.message);

  const lowered = msg.toLowerCase();

  if (/unique|duplicate|violat(e|ion)/i.test(msg) || /unique constraint|duplicate key/i.test(msg)) {
    return 'This item name already exists. Please use a different name.';
  }

  if (lowered.includes('jwt') || lowered.includes('expired') || lowered.includes('token expired')) {
    return 'Your session has expired. Please log in again.';
  }

  if (lowered.includes('network') || lowered.includes('network request failed')) {
    return 'Connection failed. Please check your internet and try again.';
  }

  if (/(401|not authenticated|not authorized|unauthorized)/i.test(msg)) {
    return "You're not authorized to perform this action.";
  }

  if (/(403|forbidden)/i.test(msg)) {
    return 'Access denied.';
  }

  // fallback
  return 'Something went wrong. Please try again or contact support.';
}

function isErrorWithMessage(value: unknown): value is { message: unknown } {
  return typeof value === 'object' && value !== null && 'message' in value;
}

export async function logError(error: unknown, context?: string) {
  try {
    // Best-effort: send to server-side logging endpoint if available
    if (typeof window !== 'undefined') {
      void fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error instanceof Error ? { message: error.message, stack: error.stack } : error, context, time: new Date().toISOString() }),
      });
    }
  } catch {
    // ignore logging failures
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('[logError]', context, error);
  }
}
