/**
 * API service for communicating with the CardioPredict AI backend.
 * All API calls go through this module for consistency.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        errorData?.detail || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      'Unable to connect to the server. Please ensure the backend is running.',
      0,
      null
    );
  }
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const api = {
  /**
   * Check backend health
   */
  getHealth: () => apiRequest('/health'),

  /**
   * Get dataset information
   */
  getDatasetInfo: () => apiRequest('/api/dataset/info'),

  /**
   * Get model evaluation metrics
   */
  getModelMetrics: () => apiRequest('/api/model/metrics'),

  /**
   * Get feature schema for form generation
   */
  getModelFeatures: () => apiRequest('/api/model/features'),

  /**
   * Submit prediction request
   */
  predict: (inputData) =>
    apiRequest('/api/predict', {
      method: 'POST',
      body: JSON.stringify(inputData),
    }),
};

export { ApiError };
export default api;
