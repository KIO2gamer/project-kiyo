const axios = require('axios');

// Set base URL for API requests
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global error responses
api.interceptors.response.use(
  response => response,
  async error => {
    // Log errors for debugging
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

module.exports = api;
