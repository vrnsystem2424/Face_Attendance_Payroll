// backend/utils/geocoding.js
// 🌍 FREE OpenStreetMap (Nominatim) Geocoding
// No API key, No card, No billing - FREE FOREVER!

const axios = require('axios');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Convert GPS coordinates to readable address (FREE)
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string|null>} Full address or null
 */
const reverseGeocode = async (latitude, longitude) => {
  try {
    if (!latitude || !longitude) return null;

    const response = await axios.get(NOMINATIM_URL, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        'accept-language': 'en',
        zoom: 18, // Detailed address
        addressdetails: 1,
      },
      headers: {
        // Required by Nominatim usage policy
        'User-Agent': 'AttendanceSystem/1.0',
      },
      timeout: 8000, // 8 second timeout
    });

    if (response.data && response.data.display_name) {
      const address = response.data.display_name;
      console.log(`📍 Geocoded (OSM): ${latitude},${longitude}`);
      console.log(`   → ${address}`);
      return address;
    }

    console.log(`⚠️ No address found for ${latitude},${longitude}`);
    return null;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Geocoding timeout (8s exceeded)');
    } else if (error.response) {
      console.error(`❌ Geocoding error: ${error.response.status} - ${error.response.statusText}`);
    } else {
      console.error('❌ Geocoding error:', error.message);
    }
    return null;
  }
};

/**
 * Get detailed address components (FREE)
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<object|null>}
 */
const getDetailedAddress = async (latitude, longitude) => {
  try {
    if (!latitude || !longitude) return null;

    const response = await axios.get(NOMINATIM_URL, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        'accept-language': 'en',
        zoom: 18,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'AttendanceSystem/1.0',
      },
      timeout: 8000,
    });

    if (response.data && response.data.address) {
      const addr = response.data.address;
      return {
        full: response.data.display_name,
        street: addr.road || addr.street || addr.pedestrian || '',
        area: addr.suburb || addr.neighbourhood || addr.locality || addr.hamlet || '',
        city: addr.city || addr.town || addr.village || addr.county || addr.municipality || '',
        district: addr.state_district || addr.county || '',
        state: addr.state || '',
        country: addr.country || '',
        postal_code: addr.postcode || '',
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Detailed address error:', error.message);
    return null;
  }
};

module.exports = {
  reverseGeocode,
  getDetailedAddress,
};