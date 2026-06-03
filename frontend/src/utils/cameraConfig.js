// src/utils/cameraConfig.js

// ── Best camera settings for face detection ──
export const HD_CAMERA_CONFIG = {
  width: { ideal: 1920, min: 1280 },
  height: { ideal: 1080, min: 720 },
  facingMode: 'user',
  
  // ── Quality settings ──
  advanced: [
    { focusMode: 'continuous' },
    { exposureMode: 'continuous' },
    { whiteBalanceMode: 'continuous' },
  ],
};

// ── For older/low-end phones ──
export const MEDIUM_CAMERA_CONFIG = {
  width: { ideal: 1280, min: 640 },
  height: { ideal: 720, min: 480 },
  facingMode: 'user',
};

// ── Get best possible camera config ──
export const getBestCameraConfig = async () => {
  try {
    // Check what camera supports
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    
    console.log(`📷 Found ${videoDevices.length} camera(s)`);

    // Try HD first
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
        }
      });
      
      // Check actual resolution
      const track = testStream.getVideoTracks()[0];
      const settings = track.getSettings();
      console.log(`📷 Camera supports: ${settings.width}x${settings.height}`);
      
      // Stop test stream
      testStream.getTracks().forEach(t => t.stop());

      if (settings.width >= 1280) {
        console.log('📷 Using HD config');
        return HD_CAMERA_CONFIG;
      }
    } catch (e) {
      console.log('📷 HD not supported, trying medium');
    }

    console.log('📷 Using medium config');
    return MEDIUM_CAMERA_CONFIG;
    
  } catch (err) {
    console.error('Camera check failed:', err);
    return MEDIUM_CAMERA_CONFIG;
  }
};

// ── Apply camera enhancements after stream starts ──
export const enhanceCameraStream = async (webcamRef) => {
  try {
    if (!webcamRef?.current?.video?.srcObject) return;
    
    const stream = webcamRef.current.video.srcObject;
    const track = stream.getVideoTracks()[0];
    
    if (!track) return;

    const capabilities = track.getCapabilities?.() || {};
    const settings = track.getSettings();
    
    console.log('📷 Current settings:', {
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate,
    });

    // ── Apply constraints ──
    const constraints = {};

    // Focus mode
    if (capabilities.focusMode?.includes('continuous')) {
      constraints.focusMode = 'continuous';
    }

    // Exposure
    if (capabilities.exposureMode?.includes('continuous')) {
      constraints.exposureMode = 'continuous';
    }

    // White balance
    if (capabilities.whiteBalanceMode?.includes('continuous')) {
      constraints.whiteBalanceMode = 'continuous';
    }

    // Brightness — thoda boost
    if (capabilities.brightness) {
      const mid = (capabilities.brightness.min + capabilities.brightness.max) / 2;
      constraints.brightness = Math.min(mid * 1.1, capabilities.brightness.max);
    }

    // Contrast — slight boost
    if (capabilities.contrast) {
      const mid = (capabilities.contrast.min + capabilities.contrast.max) / 2;
      constraints.contrast = Math.min(mid * 1.05, capabilities.contrast.max);
    }

    // Sharpness — boost for better face edges
    if (capabilities.sharpness) {
      constraints.sharpness = Math.min(
        capabilities.sharpness.max * 0.8,
        capabilities.sharpness.max
      );
    }

    // Frame rate — higher for better blink detection
    if (capabilities.frameRate) {
      constraints.frameRate = { ideal: 30, min: 15 };
    }

    if (Object.keys(constraints).length > 0) {
      await track.applyConstraints({ advanced: [constraints] });
      console.log('📷 Enhanced camera settings applied:', constraints);
    }

    // Log final settings
    const finalSettings = track.getSettings();
    console.log('📷 Final camera:', {
      width: finalSettings.width,
      height: finalSettings.height,
      frameRate: finalSettings.frameRate,
      focusMode: finalSettings.focusMode,
    });

  } catch (err) {
    console.log('📷 Camera enhancement failed (ok):', err.message);
  }
};