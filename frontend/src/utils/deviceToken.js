// utils/deviceToken.js

const getOrCreateDeviceToken = () => {
  // Pehle check karo localStorage me kuch hai
  let token = localStorage.getItem('device_token');
  
  if (!token) {
    // Naya unique token banao — registration ke time ek baar
    token = 'DEV_' + Date.now() + '_' + 
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    localStorage.setItem('device_token', token);
  }
  
  return token;
};

export default getOrCreateDeviceToken;