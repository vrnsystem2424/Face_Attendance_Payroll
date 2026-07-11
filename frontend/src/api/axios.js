// import axios from 'axios';

// const API = axios.create({
//   baseURL: 'http://localhost:5000/api',
//   // baseURL: 'https://attendancesystem.up.railway.app/api',
// });

// // Har request me token add karo
// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     req.headers.Authorization = `Bearer ${token}`;
//   }
//   return req;
// });

// export default API;





import axios from 'axios';

const API = axios.create({
  // baseURL: 'http://localhost:5000/api',
   baseURL: 'https://face-attendance-payroll-a2e6.vercel.app/api',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  
  // 🔍 Debug — baad mein hatao
  console.log('📡 Request:', req.method?.toUpperCase(), req.url);
  console.log('🔑 Token:', token ? '✅ Present' : '❌ NULL');
  
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

export default API;