import { ApiError } from '../types/gateway';

export const API_BASE_URL = '/api';
export type AuthScope = 'none' | 'gateway' | 'admin';

export const getGatewayApiKey = (): string | null => localStorage.getItem('gateway_api_key');
export const getAdminApiKey = (): string | null => sessionStorage.getItem('admin_api_key');
export const setAdminApiKey = (value: string): void => {
  if (value.trim()) sessionStorage.setItem('admin_api_key', value.trim());
  else sessionStorage.removeItem('admin_api_key');
};

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}, auth: AuthScope = 'gateway'): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth === 'gateway') {
    const key = getGatewayApiKey();
    if (key) headers['X-Gateway-API-Key'] = key;
  } else if (auth === 'admin') {
    const key = getAdminApiKey();
    if (!key) throw { detail: 'Enter the admin key in Settings to unlock live telemetry.', status: 401 } as ApiError;
    headers['X-Admin-Key'] = key;
  }
  try {
    const response = await fetch(API_BASE_URL + (endpoint.startsWith('/') ? endpoint : '/' + endpoint), { ...options, headers: { ...headers, ...options.headers } });
    if (!response.ok) {
      let detail = 'Request failed with status ' + response.status;
      try {
        const body = await response.json();
        detail = body?.error?.message ?? (typeof body?.detail === 'string' ? body.detail : detail);
      } catch { if (response.statusText) detail = response.statusText; }
      if (response.status === 429 && response.headers.get('Retry-After')) detail += ' Retry after ' + response.headers.get('Retry-After') + ' seconds.';
      throw { detail, status: response.status, retryAfter: Number(response.headers.get('Retry-After')) || undefined, requestId: response.headers.get('X-Request-ID') || undefined } as ApiError;
    }
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  } catch (error) {
    if ((error as ApiError).status !== undefined) throw error;
    throw { detail: 'Unable to reach the Gateway. Check that FastAPI is running on port 8000.', status: 0 } as ApiError;
  }
}
