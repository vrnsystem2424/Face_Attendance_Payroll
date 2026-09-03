

import axios from 'axios';

const API = axios.create({

  baseURL: 'http://localhost:5001/api',


  // baseURL: 'https://attendance-backend-api.signaturesbuilders.com/api',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  console.log('📡 Request:', req.method?.toUpperCase(), req.url);
  console.log('🔑 Token:', token ? '✅ Present' : '❌ NULL');
  
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// 🆕 Auto logout if password changed
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.config?.url);
    
    // 🆕 Handle PASSWORD_CHANGED response
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      
      if (errorCode === 'PASSWORD_CHANGED') {
        console.log('🔒 Password changed - Auto logout');
        
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Show alert
        alert('⚠️ Aapka password change ho gaya hai. Dobara login karo.');
        
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default API;
