import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  onUnauthorized = handler;
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Zamienia ścieżkę API (/api/...) na pełny URL do pobrania pliku */
export const resolveDocumentUrl = (documentUrl: string): string => {
  if (documentUrl.startsWith('http://') || documentUrl.startsWith('https://')) {
    return documentUrl;
  }
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${apiOrigin}${documentUrl.startsWith('/') ? documentUrl : `/${documentUrl}`}`;
};

/** Pobiera plik raportu — publiczny przez link, chroniony przez API z tokenem */
export const downloadReportFile = async (documentUrl: string): Promise<void> => {
  if (documentUrl.includes('/public/') || documentUrl.startsWith('http')) {
    window.open(resolveDocumentUrl(documentUrl), '_blank', 'noopener,noreferrer');
    return;
  }

  const apiPath = documentUrl.replace(/^\/api\//, '');
  const response = await apiClient.get(apiPath, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'raport-esg.pdf';
  link.click();
  URL.revokeObjectURL(link.href);
};

export default apiClient;
