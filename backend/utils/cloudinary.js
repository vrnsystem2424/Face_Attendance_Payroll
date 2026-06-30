// backend/utils/cloudinary.js

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Upload selfie to Cloudinary
 * @param {string} base64Image - base64 image string
 * @param {string} empCode - employee code
 * @param {string} actionType - 'IN' or 'OUT'
 * @returns {object} { url, public_id, bytes }
 */
const uploadSelfie = async (base64Image, empCode, actionType) => {
  try {
    if (!base64Image) return null;

    const timestamp = Date.now();
    const fileName  = `${empCode}_${timestamp}_${actionType}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      folder:        'attendance-selfies',
      public_id:     fileName,
      resource_type: 'image',
      transformation: [
        { width: 480, height: 360, crop: 'limit' },
        { quality: 'auto:low' },        // Auto compress
        { fetch_format: 'auto' },       // WebP for browsers
      ],
    });

    return {
      url:       result.secure_url,
      public_id: result.public_id,
      bytes:     result.bytes,
    };
  } catch (err) {
    console.error('❌ Cloudinary upload error:', err.message);
    return null;
  }
};

/**
 * Delete selfie from Cloudinary
 */
const deleteSelfie = async (publicId) => {
  try {
    if (!publicId) return false;
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (err) {
    console.error('❌ Cloudinary delete error:', err.message);
    return false;
  }
};

module.exports = {
  uploadSelfie,
  deleteSelfie,
  cloudinary,
};