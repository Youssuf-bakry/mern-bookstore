// Create this file in your client/src/ folder
// config.js - Simple API configuration

const config = {
  API_BASE_URL: import.meta.env.DEV ? 'http://localhost:5000' : '',
};

export default config;