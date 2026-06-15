const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'caisse_emergence_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Impossible de contacter le serveur. Vérifiez que le backend est démarré et que VITE_API_URL est correct."
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // réponse sans corps JSON (ex: 204)
  }

  if (res.status === 401 && auth) {
    // Session expirée ou invalide : on déconnecte proprement.
    setToken(null);
    localStorage.removeItem('caisse_emergence_user');
    window.location.reload();
    return null;
  }

  if (!res.ok) {
    const error = new Error(data?.message || `Erreur (${res.status})`);
    error.status = res.status;
    throw error;
  }

  return data;
}

const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  getToken,
  setToken,
};

export default api;
