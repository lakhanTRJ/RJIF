let csrfToken = '';

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(csrfToken && !['GET', 'HEAD'].includes(method) ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  if (body.csrfToken) csrfToken = body.csrfToken;
  return body;
}
