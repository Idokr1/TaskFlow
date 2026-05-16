/**
 * Tiny fetch wrapper that normalises the server's response shapes.
 *
 *   - Success responses use the envelope `{ data: ... }`. We unwrap it here so
 *     callers receive plain values.
 *   - Error responses use `{ error: { code, message } }`. We surface them as
 *     a typed `ApiError` so the UI can match on `code` or display `message`.
 *   - Network failures (server unreachable) are also wrapped in `ApiError`,
 *     giving the UI a single error type to handle.
 *
 * 204 responses (e.g. successful DELETE) have no body — we return `undefined`.
 */

export type ApiErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR' | 'NETWORK_ERROR';

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(message: string, code: ApiErrorCode, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

interface ServerErrorEnvelope {
  error?: { code?: string; message?: string };
}

interface ServerSuccessEnvelope<T> {
  data: T;
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    value === 'VALIDATION_ERROR' ||
    value === 'NOT_FOUND' ||
    value === 'INTERNAL_ERROR' ||
    value === 'NETWORK_ERROR'
  );
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  // Some responses (204, errors with empty body) may have no JSON content.
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    // Network-level failure (server down, DNS, CORS, aborted, ...)
    const message = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(message, 'NETWORK_ERROR', 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const envelope = payload as ServerErrorEnvelope | undefined;
    const code = isApiErrorCode(envelope?.error?.code)
      ? envelope!.error!.code!
      : 'INTERNAL_ERROR';
    const message = envelope?.error?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, code, response.status);
  }

  const envelope = payload as ServerSuccessEnvelope<T> | undefined;
  if (!envelope || !('data' in envelope)) {
    throw new ApiError('Malformed server response', 'INTERNAL_ERROR', response.status);
  }
  return envelope.data;
}
