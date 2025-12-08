import axios from 'axios';

/**
 * HTTP Client utility using Axios
 * Use this for making external API calls from the backend
 */

// Create axios instance with default config
const httpClient = axios.create({
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
httpClient.interceptors.request.use(
  (config) => {
    // Add auth tokens, logging, etc. here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Example: Send webhook notification
 */
export async function sendWebhook(url, data) {
  try {
    const response = await httpClient.post(url, data);
    return response.data;
  } catch (error) {
    console.error('Webhook failed:', error.message);
    throw error;
  }
}

/**
 * Example: Call external API
 */
export async function callExternalAPI(url, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url,
      ...(data && { data }),
    };
    const response = await httpClient(config);
    return response.data;
  } catch (error) {
    console.error('External API call failed:', error.message);
    throw error;
  }
}

export default httpClient;

