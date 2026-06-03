/**
 * ══════════════════════════════════════
 *  LIVENESS DETECTION UTILITY
 *  Anti-spoofing for face attendance
 * ══════════════════════════════════════
 *
 * Detects if face is REAL or PHOTO/SCREEN
 * Uses: Blink detection, head movement, micro-movement analysis
 */

import * as faceapi from '@vladmandic/face-api';

// ── EYE ASPECT RATIO (EAR) ──
// Low EAR = eye closed (blink)
// Formula: (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
const calculateEAR = (eye) => {
  // eye = array of 6 landmark points
  const vertical1 = Math.sqrt(
    Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2)
  );
  const vertical2 = Math.sqrt(
    Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2)
  );
  const horizontal = Math.sqrt(
    Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2)
  );

  if (horizontal === 0) return 0.3;
  return (vertical1 + vertical2) / (2.0 * horizontal);
};

// ── GET EYE LANDMARKS FROM 68-POINT MODEL ──
// Left eye: points 36-41, Right eye: points 42-47
const getEyePoints = (landmarks) => {
  const positions = landmarks.positions;
  const leftEye = positions.slice(36, 42);
  const rightEye = positions.slice(42, 48);
  return { leftEye, rightEye };
};

// ── FACE ANGLE FROM LANDMARKS ──
// Nose tip vs face center gives head rotation
const getFaceAngle = (landmarks) => {
  const positions = landmarks.positions;
  const nose = positions[30];        // nose tip
  const leftCheek = positions[0];    // jaw left
  const rightCheek = positions[16];  // jaw right
  const chin = positions[8];         // chin bottom
  const forehead = positions[27];    // between eyes (top of nose bridge)

  // Horizontal angle (yaw) — nose position relative to face center
  const faceCenter = (leftCheek.x + rightCheek.x) / 2;
  const faceWidth = rightCheek.x - leftCheek.x;
  const yaw = faceWidth > 0 ? (nose.x - faceCenter) / faceWidth : 0;

  // Vertical angle (pitch) — nose relative to face height
  const faceHeight = chin.y - forehead.y;
  const faceMidY = (chin.y + forehead.y) / 2;
  const pitch = faceHeight > 0 ? (nose.y - faceMidY) / faceHeight : 0;

  return { yaw, pitch };
};

// ══════════════════════════════════════
//  LIVENESS CHECKER CLASS
// ══════════════════════════════════════
class LivenessChecker {
  constructor(options = {}) {
    this.EAR_THRESHOLD = options.earThreshold || 0.22;       // below = blink
    this.BLINK_REQUIRED = options.blinkRequired ?? true;     // require blink?
    this.MOVEMENT_THRESHOLD = options.movementThreshold || 0.015; // min head movement
    this.STILLNESS_THRESHOLD = options.stillnessThreshold || 0.002; // too still = photo
    this.CHECK_FRAMES = options.checkFrames || 15;           // frames to analyze
    this.MIN_FRAMES = options.minFrames || 8;                // minimum before decision
    this.PASS_SCORE = options.passScore || 50;               // minimum score to pass

    // State
    this.frames = [];          // { ear, yaw, pitch, timestamp }
    this.blinkDetected = false;
    this.prevEarOpen = true;   // was eye open in previous frame?
    this.result = null;        // null = checking, object = done
  }

  reset() {
    this.frames = [];
    this.blinkDetected = false;
    this.prevEarOpen = true;
    this.result = null;
  }

  // ── ADD FRAME ──
  addFrame(landmarks) {
    const { leftEye, rightEye } = getEyePoints(landmarks);
    const leftEAR = calculateEAR(leftEye);
    const rightEAR = calculateEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2;

    const { yaw, pitch } = getFaceAngle(landmarks);

    // Blink detection
    const isEyeClosed = avgEAR < this.EAR_THRESHOLD;
    if (this.prevEarOpen && isEyeClosed) {
      this.blinkDetected = true;
    }
    this.prevEarOpen = !isEyeClosed;

    this.frames.push({
      ear: avgEAR,
      yaw,
      pitch,
      timestamp: Date.now(),
    });

    // Keep only recent frames
    if (this.frames.length > this.CHECK_FRAMES) {
      this.frames.shift();
    }

    // Evaluate if enough frames
    if (this.frames.length >= this.MIN_FRAMES) {
      this.result = this._evaluate();
    }

    return {
      frameCount: this.frames.length,
      blinkDetected: this.blinkDetected,
      currentEAR: avgEAR,
      isEyeClosed,
      result: this.result,
    };
  }

  // ── EVALUATE LIVENESS ──
  _evaluate() {
    const yaws = this.frames.map(f => f.yaw);
    const pitches = this.frames.map(f => f.pitch);
    const ears = this.frames.map(f => f.ear);

    // 1. Head movement analysis
    const yawRange = Math.max(...yaws) - Math.min(...yaws);
    const pitchRange = Math.max(...pitches) - Math.min(...pitches);
    const totalMovement = yawRange + pitchRange;

    // 2. Micro-movement (jitter) — real faces have small involuntary movements
    let jitterSum = 0;
    for (let i = 1; i < yaws.length; i++) {
      jitterSum += Math.abs(yaws[i] - yaws[i-1]) + Math.abs(pitches[i] - pitches[i-1]);
    }
    const avgJitter = jitterSum / (yaws.length - 1);

    // 3. EAR variance — real eyes have slight fluctuations
    const avgEAR = ears.reduce((a, b) => a + b, 0) / ears.length;
    const earVariance = ears.reduce((sum, e) => sum + Math.pow(e - avgEAR, 2), 0) / ears.length;

    // ── SCORING ──
    let score = 0;
    let reasons = [];
    let flags = [];

    // Blink detected = strong signal
    if (this.blinkDetected) {
      score += 40;
      reasons.push('blink_detected');
    } else {
      flags.push('no_blink');
    }

    // Head micro-movement (involuntary)
    if (avgJitter > this.STILLNESS_THRESHOLD) {
      score += 25;
      reasons.push('micro_movement');
    } else {
      flags.push('too_still');
    }

    // EAR variance (real eyes fluctuate slightly)
    if (earVariance > 0.0003) {
      score += 15;
      reasons.push('ear_variance');
    } else {
      flags.push('static_eyes');
    }

    // Some head movement (natural sway)
    if (totalMovement > this.MOVEMENT_THRESHOLD) {
      score += 20;
      reasons.push('head_movement');
    } else {
      flags.push('no_movement');
    }

    // ── DECISION ──
    // Photo pe: no blink + too still + static eyes = score ~0
    // Real person: blink + micro movement + ear variance = score ~80-100
    const isLive = score >= this.PASS_SCORE;

    return {
      isLive,
      score,
      reasons,    // what passed
      flags,      // what failed
      details: {
        blinkDetected: this.blinkDetected,
        totalMovement: totalMovement.toFixed(4),
        avgJitter: avgJitter.toFixed(5),
        earVariance: earVariance.toFixed(6),
        framesAnalyzed: this.frames.length,
      }
    };
  }

  // ── STATUS MESSAGE ──
  getStatusMessage() {
    if (this.frames.length < this.MIN_FRAMES) {
      return {
        message: `Checking liveness... (${this.frames.length}/${this.MIN_FRAMES})`,
        hint: !this.blinkDetected ? 'Blink naturally' : 'Hold steady...',
      };
    }
    if (this.result) {
      if (this.result.isLive) {
        return { message: 'Live face verified', hint: '' };
      } else {
        const hints = [];
        if (this.result.flags.includes('no_blink')) hints.push('blink');
        if (this.result.flags.includes('too_still')) hints.push('move slightly');
        return {
          message: 'Liveness check failed',
          hint: hints.length > 0 ? `Try: ${hints.join(', ')}` : 'Try again',
        };
      }
    }
    return { message: 'Analyzing...', hint: '' };
  }

  get isComplete() {
    return this.result !== null;
  }

  get isLive() {
    return this.result?.isLive || false;
  }
}

export default LivenessChecker;
export { calculateEAR, getEyePoints, getFaceAngle };