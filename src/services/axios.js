import axios from 'axios';

// Determine base URL (defaulting to a placeholder for offline use or local development)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.shopcraft-placeholder.com/api';

/**
 * Custom Axios client instance.
 * Preconfigured with timeouts, default headers, interceptors, and offline-first safety checks.
 */
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Offline preflight check: fail fast or log warnings if user is completely offline
    if (!navigator.onLine) {
      console.warn('Network request initiated while browser is offline. Request will be queued or will fail.');
      // Optionally we can reject early to prevent long timeouts when we know we are offline
      // throw new axios.Cancel('Application is currently offline. Action deferred.');
    }

    // Attach authentication or tenant tokens if they exist in local storage or store
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle generic status codes
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 401:
          console.error('Unauthorized access - potential token expiration.');
          // Redirect to login or refresh token if auth system is configured
          break;
        case 403:
          console.error('Forbidden - user does not have required permissions.');
          break;
        case 404:
          console.warn('API endpoint or requested resource not found.');
          break;
        case 500:
          console.error('Internal Server Error. Please contact administrator.');
          break;
        default:
          console.error(`API Error: ${status}`, error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server. Inspect network connectivity.', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request setup failure:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Future Google Sheets Synchronization Endpoints
 * Placeholders to connect offline IndexedDB data back to online spreadsheets.
 */
export const syncService = {
  /**
   * Upload database payload to the Google Sheet sync endpoint
   * @param {string} sheetId Google Sheets ID
   * @param {object} payload Complete tables export payload
   */
  uploadToGoogleSheets: async (sheetId, payload) => {
    if (!navigator.onLine) {
      throw new Error('Network offline. Sync deferred.');
    }
    
    // In Step 3, this will communicate with the spreadsheet API
    return axiosInstance.post('/sync/sheets', {
      sheetId,
      timestamp: new Date().toISOString(),
      data: payload,
    });
  },

  /**
   * Download external records to merge locally
   * @param {string} sheetId Google Sheets ID
   */
  downloadFromGoogleSheets: async (sheetId) => {
    if (!navigator.onLine) {
      throw new Error('Network offline. Sync deferred.');
    }
    
    const response = await axiosInstance.get(`/sync/sheets/${sheetId}`);
    return response.data;
  }
};

export default axiosInstance;
