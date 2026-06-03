// src/utils/deviceFingerprint.js

const getDeviceFingerprint = async () => {
  const components = [];

  // 1. Screen info
  components.push(`screen:${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`);

  // 2. User Agent
  components.push(`ua:${navigator.userAgent}`);

  // 3. Platform
  components.push(`platform:${navigator.platform || 'unknown'}`);

  // 4. Language
  components.push(`lang:${navigator.language}`);

  // 5. Timezone
  components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

  // 6. Hardware concurrency (CPU cores)
  components.push(`cores:${navigator.hardwareConcurrency || 'unknown'}`);

  // 7. Device memory
  components.push(`mem:${navigator.deviceMemory || 'unknown'}`);

  // 8. Touch support
  components.push(`touch:${navigator.maxTouchPoints || 0}`);

  // 9. Canvas fingerprint — unique per device/browser
  const canvasFP = getCanvasFingerprint();
  components.push(`canvas:${canvasFP}`);

  // 10. WebGL renderer
  const webglFP = getWebGLFingerprint();
  components.push(`webgl:${webglFP}`);

  // Combine all and hash
  const raw = components.join('|');
  const hash = await sha256(raw);

  return {
    fingerprint: hash,
    raw_components: {
      screen: `${window.screen.width}x${window.screen.height}`,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency,
      memory: navigator.deviceMemory,
      touch_points: navigator.maxTouchPoints,
    }
  };
};

// Canvas fingerprint — draws hidden shapes, each device renders slightly differently
const getCanvasFingerprint = () => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');

    // Draw text with specific styling
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('FaceAttend Device 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Fingerprint Test', 4, 17);

    // Add arc
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    return canvas.toDataURL().slice(-50); // last 50 chars as fingerprint
  } catch {
    return 'canvas-not-supported';
  }
};

// WebGL fingerprint — GPU info
const getWebGLFingerprint = () => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor}~${renderer}`;
    }
    return 'webgl-no-debug';
  } catch {
    return 'webgl-error';
  }
};

// SHA-256 hash
const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default getDeviceFingerprint;