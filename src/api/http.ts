export interface HttpClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body?: unknown): Promise<T>;
  put<T>(url: string, body?: unknown): Promise<T>;
  patch<T>(url: string, body?: unknown): Promise<T>;
  del<T>(url: string): Promise<T>;
}

export interface HttpClientOptions {
  baseUrl: string;
  getAuthToken?: () => string | null;
}

async function request<T>(opts: HttpClientOptions, method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const token = opts.getAuthToken?.();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${opts.baseUrl}${url}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // Intentar parsear como JSON para obtener el mensaje de error
    try {
      const errorData = JSON.parse(text);
      // Manejar diferentes estructuras de error del backend
      let errorMessage = '';

      if (errorData.error?.message) {
        // Estructura: {success: false, error: {code, message}}
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        // Estructura: {message: "..."}
        errorMessage = errorData.message;
      } else if (typeof errorData.error === 'string') {
        // Estructura: {error: "..."}
        errorMessage = errorData.error;
      } else {
        // Si no se encuentra mensaje, usar un genérico
        errorMessage = 'Ha ocurrido un error';
      }

      throw new Error(errorMessage);
    } catch (err) {
      // Si no es JSON válido o hubo error al parsear
      if (err instanceof Error && err.message !== text) {
        // Si es un Error que lanzamos nosotros, re-lanzarlo
        throw err;
      }
      // Si no, mostrar el texto tal cual o mensaje genérico
      throw new Error(text || `Error ${res.status}: ${res.statusText}`);
    }
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}

export function createHttpClient(opts: HttpClientOptions): HttpClient {
  return {
    get: (url) => request(opts, 'GET', url),
    post: (url, body) => request(opts, 'POST', url, body),
    put: (url, body) => request(opts, 'PUT', url, body),
    patch: (url, body) => request(opts, 'PATCH', url, body),
    del: (url) => request(opts, 'DELETE', url),
  };
}
