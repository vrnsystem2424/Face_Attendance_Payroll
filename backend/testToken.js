// backend folder mein ek test file banao: testToken.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = 'YAHAN_APNA_TOKEN_PASTE_KARO'; // localStorage se copy karo

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ Token valid:', decoded);
} catch (err) {
  console.log('❌ Token invalid:', err.message);
}