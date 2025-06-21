// Create this file in your client/src/ folder
// config.js - API configuration with Render backend

const config = {
  API_BASE_URL: import.meta.env.DEV 
    ? 'http://localhost:5000' 
    : 'https://mern-bookstore-backend-amt0.onrender.com',
};

export default config;