

// /**
//  * ══════════════════════════════════════
//  *  LIVENESS DETECTION - Challenge v3
//  *  Random Action Challenge System
//  * ══════════════════════════════════════
//  */

// // ── EYE ASPECT RATIO ──
// const calculateEAR = (eye) => {
//   const v1 = Math.sqrt(Math.pow(eye[1].x-eye[5].x,2)+Math.pow(eye[1].y-eye[5].y,2));
//   const v2 = Math.sqrt(Math.pow(eye[2].x-eye[4].x,2)+Math.pow(eye[2].y-eye[4].y,2));
//   const h  = Math.sqrt(Math.pow(eye[0].x-eye[3].x,2)+Math.pow(eye[0].y-eye[3].y,2));
//   if(h===0) return 0.3;
//   return (v1+v2)/(2.0*h);
// };

// const getEyePoints = (landmarks) => {
//   const p = landmarks.positions;
//   return { leftEye: p.slice(36,42), rightEye: p.slice(42,48) };
// };

// // ── FACE ANGLE ──
// const getFaceAngle = (landmarks) => {
//   const p = landmarks.positions;
//   const nose       = p[30];
//   const leftCheek  = p[0];
//   const rightCheek = p[16];
//   const chin       = p[8];
//   const forehead   = p[27];

//   const faceCenter = (leftCheek.x + rightCheek.x) / 2;
//   const faceWidth  = rightCheek.x - leftCheek.x;
//   const yaw        = faceWidth > 0 ? (nose.x - faceCenter) / faceWidth : 0;

//   const faceHeight = chin.y - forehead.y;
//   const faceMidY   = (chin.y + forehead.y) / 2;
//   const pitch      = faceHeight > 0 ? (nose.y - faceMidY) / faceHeight : 0;

//   return { yaw, pitch };
// };

// // ── MOUTH OPEN DETECTION ──
// const getMouthOpenRatio = (landmarks) => {
//   const p = landmarks.positions;
//   const upperLip = p[62];
//   const lowerLip = p[66];
//   const mouthH   = Math.sqrt(
//     Math.pow(upperLip.x-lowerLip.x,2)+Math.pow(upperLip.y-lowerLip.y,2)
//   );
//   const mouthW = Math.sqrt(
//     Math.pow(p[48].x-p[54].x,2)+Math.pow(p[48].y-p[54].y,2)
//   );
//   return mouthW > 0 ? mouthH / mouthW : 0;
// };

// // ── SMILE DETECTION ──
// // Smile me mouth corners upar aate hain
// const getSmileScore = (landmarks) => {
//   const p = landmarks.positions;
//   const leftCorner  = p[48];
//   const rightCorner = p[54];
//   const upperLipCenter = p[51];
//   // Corners relative to upper lip center
//   const leftLift  = upperLipCenter.y - leftCorner.y;
//   const rightLift = upperLipCenter.y - rightCorner.y;
//   return (leftLift + rightLift) / 2;
// };

// // ══════════════════════════════════════
// //  CHALLENGE DEFINITIONS
// // ══════════════════════════════════════
// const CHALLENGES = [
//   {
//     id: 'turn_left',
//     instruction: '⬅️ Turn your head LEFT',
//     hint: 'Slowly turn head to your left',
//     // yaw negative = head turned left
//     check: ({ yaw }) => yaw < -0.12,
//     timeout: 8000,
//   },
//   {
//     id: 'turn_right',
//     instruction: '➡️ Turn your head RIGHT',
//     hint: 'Slowly turn head to your right',
//     // yaw positive = head turned right
//     check: ({ yaw }) => yaw > 0.12,
//     timeout: 8000,
//   },
//   {
//     id: 'open_mouth',
//     instruction: '😮 Open your MOUTH wide',
//     hint: 'Open mouth as wide as possible',
//     // mouth open ratio > threshold
//     check: ({ mouthRatio }) => mouthRatio > 0.3,
//     timeout: 8000,
//   },
//   {
//     id: 'nod',
//     instruction: '🙂 NOD your head (up-down)',
//     hint: 'Move head up then down slowly',
//     // pitch changes significantly
//     check: ({ pitchRange }) => pitchRange > 0.08,
//     timeout: 8000,
//   },
//   {
//     id: 'blink',
//     instruction: '👁️ BLINK your eyes',
//     hint: 'Blink naturally once or twice',
//     check: ({ blinked }) => blinked,
//     timeout: 8000,
//   },
// ];

// // ── GET 2 RANDOM CHALLENGES ──
// const getRandomChallenges = (count = 2) => {
//   const shuffled = [...CHALLENGES].sort(() => Math.random() - 0.5);
//   return shuffled.slice(0, count);
// };

// // ══════════════════════════════════════
// //  LIVENESS CHECKER - Challenge Mode
// // ══════════════════════════════════════
// class LivenessChecker {
//   constructor(options = {}) {
//     this.CHALLENGES_REQUIRED = options.challengesRequired || 2;
//     this.challenges          = getRandomChallenges(this.CHALLENGES_REQUIRED);
//     this.currentIndex        = 0;

//     // Per-challenge state
//     this._resetChallengeState();

//     // Overall
//     this.completedChallenges = [];
//     this.failed              = false;
//     this.failReason          = '';
//     this.startTime           = Date.now();
//     this.challengeStartTime  = Date.now();

//     // Pitch tracking for nod
//     this.pitchHistory        = [];
//   }

//   _resetChallengeState() {
//     this.framesSeen  = 0;
//     this.blinked     = false;
//     this.prevEarOpen = true;
//     this.pitchHistory = [];
//     this.challengeStartTime = Date.now();
//   }

//   reset() {
//     this.challenges          = getRandomChallenges(this.CHALLENGES_REQUIRED);
//     this.currentIndex        = 0;
//     this.completedChallenges = [];
//     this.failed              = false;
//     this.failReason          = '';
//     this.startTime           = Date.now();
//     this._resetChallengeState();
//   }

//   get currentChallenge() {
//     return this.challenges[this.currentIndex] || null;
//   }

//   get isComplete() {
//     return this.completedChallenges.length >= this.CHALLENGES_REQUIRED;
//   }

//   get isLive() {
//     return this.isComplete && !this.failed;
//   }

//   get isPhotoDetected() {
//     return this.failed && this.failReason === 'timeout';
//   }

//   // ── ADD FRAME ──
//   addFrame(landmarks) {
//     if (this.isComplete || this.failed) {
//       return this._getStatus();
//     }

//     const challenge = this.currentChallenge;
//     if (!challenge) return this._getStatus();

//     // ── Timeout Check ──
//     const elapsed = Date.now() - this.challengeStartTime;
//     if (elapsed > challenge.timeout) {
//       // Challenge timed out = likely photo/video
//       this.failed     = true;
//       this.failReason = 'timeout';
//       return this._getStatus();
//     }

//     // ── Extract Features ──
//     const { leftEye, rightEye } = getEyePoints(landmarks);
//     const leftEAR   = calculateEAR(leftEye);
//     const rightEAR  = calculateEAR(rightEye);
//     const avgEAR    = (leftEAR + rightEAR) / 2;
//     const { yaw, pitch } = getFaceAngle(landmarks);
//     const mouthRatio     = getMouthOpenRatio(landmarks);
//     const smileScore     = getSmileScore(landmarks);

//     // Blink detection
//     const isEyeClosed = avgEAR < 0.22;
//     if (this.prevEarOpen && isEyeClosed) {
//       this.blinked = true;
//     }
//     this.prevEarOpen = !isEyeClosed;

//     // Pitch history for nod detection
//     this.pitchHistory.push(pitch);
//     if (this.pitchHistory.length > 20) this.pitchHistory.shift();
//     const pitchRange = this.pitchHistory.length > 1
//       ? Math.max(...this.pitchHistory) - Math.min(...this.pitchHistory)
//       : 0;

//     this.framesSeen++;

//     // ── Check Challenge ──
//     const passed = challenge.check({
//       yaw,
//       pitch,
//       pitchRange,
//       mouthRatio,
//       smileScore,
//       blinked:    this.blinked,
//       avgEAR,
//     });

//     if (passed) {
//       // Challenge passed!
//       this.completedChallenges.push(challenge.id);
//       this.currentIndex++;
//       this._resetChallengeState();
//     }

//     return this._getStatus();
//   }

//   _getStatus() {
//     const challenge = this.currentChallenge;

//     return {
//       isComplete:          this.isComplete,
//       isLive:              this.isLive,
//       isPhotoDetected:     this.isPhotoDetected,
//       failed:              this.failed,
//       failReason:          this.failReason,
//       currentChallenge:    challenge,
//       currentIndex:        this.currentIndex,
//       totalChallenges:     this.CHALLENGES_REQUIRED,
//       completedChallenges: this.completedChallenges,
//       progress: `${this.completedChallenges.length}/${this.CHALLENGES_REQUIRED}`,
//       timeLeft: challenge
//         ? Math.max(0, Math.round(
//             (challenge.timeout - (Date.now() - this.challengeStartTime)) / 1000
//           ))
//         : 0,
//     };
//   }

//   getStatusMessage() {
//     if (this.failed) {
//       return {
//         message: '❌ Liveness failed! Try again.',
//         hint:    this.failReason === 'timeout'
//           ? 'You took too long. Photo/screen detected.'
//           : 'Could not verify. Try again.',
//       };
//     }
//     if (this.isComplete) {
//       return {
//         message: '✅ Liveness verified!',
//         hint:    '',
//       };
//     }
//     const ch = this.currentChallenge;
//     if (ch) {
//       return {
//         message: ch.instruction,
//         hint:    ch.hint,
//       };
//     }
//     return { message: 'Starting...', hint: '' };
//   }
// }

// export default LivenessChecker;
// export { calculateEAR, getEyePoints, getFaceAngle };




/**
 * ══════════════════════════════════════
 *  LIVENESS - Anti-Screen v6
 *  Phone/Screen detection + Edge analysis
 * ══════════════════════════════════════
 */

const calculateEAR = (eye) => {
  const v1 = Math.sqrt(Math.pow(eye[1].x-eye[5].x,2)+Math.pow(eye[1].y-eye[5].y,2));
  const v2 = Math.sqrt(Math.pow(eye[2].x-eye[4].x,2)+Math.pow(eye[2].y-eye[4].y,2));
  const h  = Math.sqrt(Math.pow(eye[0].x-eye[3].x,2)+Math.pow(eye[0].y-eye[3].y,2));
  if (h === 0) return 0.3;
  return (v1 + v2) / (2.0 * h);
};

const getEyePoints = (landmarks) => {
  const p = landmarks.positions;
  return { leftEye: p.slice(36,42), rightEye: p.slice(42,48) };
};

const getFaceAngle = (landmarks) => {
  const p = landmarks.positions;
  const nose = p[30], leftCheek = p[0], rightCheek = p[16];
  const chin = p[8], forehead = p[27];

  const faceCenter = (leftCheek.x + rightCheek.x) / 2;
  const faceWidth  = rightCheek.x - leftCheek.x;
  const yaw = faceWidth > 0 ? (nose.x - faceCenter) / faceWidth : 0;

  const faceHeight = chin.y - forehead.y;
  const faceMidY   = (chin.y + forehead.y) / 2;
  const pitch = faceHeight > 0 ? (nose.y - faceMidY) / faceHeight : 0;

  return { yaw, pitch };
};

// ══════════════════════════════════════
//  📱 SCREEN/PHONE EDGE DETECTION
// ══════════════════════════════════════
// Phone ki screen pe rectangle border hota hai
// Real face me background natural hota hai
const detectScreenEdges = (videoElement, faceBox) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width  = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);

    // Face ke around bigger area lo (phone frame check karne ke liye)
    const padding = 50;
    const x = Math.max(0, faceBox.x - padding);
    const y = Math.max(0, faceBox.y - padding);
    const w = Math.min(canvas.width  - x, faceBox.width  + padding * 2);
    const h = Math.min(canvas.height - y, faceBox.height + padding * 2);

    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;

    // Edge detection - count strong vertical/horizontal lines
    let verticalEdges   = 0;
    let horizontalEdges = 0;
    let darkPixels      = 0;
    let totalPixels     = w * h;

    // Sample edges (har 4th pixel check)
    for (let py = 5; py < h - 5; py += 4) {
      for (let px = 5; px < w - 5; px += 4) {
        const idx = (py * w + px) * 4;

        const r = data[idx], g = data[idx+1], b = data[idx+2];
        const brightness = (r + g + b) / 3;

        // Dark pixel (phone bezel typically dark)
        if (brightness < 40) darkPixels++;

        // Horizontal edge: compare with pixel above
        const idxUp = ((py - 4) * w + px) * 4;
        const brightnessUp = (data[idxUp] + data[idxUp+1] + data[idxUp+2]) / 3;
        if (Math.abs(brightness - brightnessUp) > 80) horizontalEdges++;

        // Vertical edge: compare with pixel left
        const idxLeft = (py * w + (px - 4)) * 4;
        const brightnessLeft = (data[idxLeft] + data[idxLeft+1] + data[idxLeft+2]) / 3;
        if (Math.abs(brightness - brightnessLeft) > 80) verticalEdges++;
      }
    }

    const sampledPixels = (w / 4) * (h / 4);
    const edgeRatio  = (verticalEdges + horizontalEdges) / sampledPixels;
    const darkRatio  = darkPixels / sampledPixels;

    return {
      edgeRatio,         // > 0.15 = likely phone frame
      darkRatio,         // > 0.25 = lots of dark area (bezel)
      isScreen: edgeRatio > 0.12 || darkRatio > 0.30,
    };
  } catch (err) {
    return { edgeRatio: 0, darkRatio: 0, isScreen: false };
  }
};

// ══════════════════════════════════════
//  ✨ SCREEN GLARE/REFLECTION DETECTION
// ══════════════════════════════════════
const detectScreenGlare = (videoElement, faceBox) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width  = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);

    // Face area se data lo
    const imageData = ctx.getImageData(faceBox.x, faceBox.y, faceBox.width, faceBox.height);
    const data = imageData.data;

    let veryBright = 0;
    let total = 0;

    // Sample every 4th pixel
    for (let i = 0; i < data.length; i += 16) {
      const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
      if (brightness > 230) veryBright++;
      total++;
    }

    const glareRatio = veryBright / total;
    return {
      glareRatio,
      hasGlare: glareRatio > 0.05, // 5% pixels very bright = screen glare
    };
  } catch {
    return { glareRatio: 0, hasGlare: false };
  }
};

// ══════════════════════════════════════
//  LIVENESS CHECKER
// ══════════════════════════════════════
class LivenessChecker {
  constructor(options = {}) {
    this.MIN_FRAMES = options.minFrames || 6;
    this.MAX_FRAMES = options.maxFrames || 15;
    this.PASS_SCORE = options.passScore || 50;

    this.frames        = [];
    this.blinkDetected = false;
    this.prevEarOpen   = true;
    this.result        = null;
    this.screenDetectionCount = 0;
    this.glareDetectionCount  = 0;
    this.totalChecks   = 0;
  }

  reset() {
    this.frames               = [];
    this.blinkDetected        = false;
    this.prevEarOpen          = true;
    this.result               = null;
    this.screenDetectionCount = 0;
    this.glareDetectionCount  = 0;
    this.totalChecks          = 0;
  }

  // 🆕 NEW: addFrame now also takes video & faceBox
  addFrame(landmarks, videoElement, faceBox) {
    if (this.result) return this._getStatus();

    const { leftEye, rightEye } = getEyePoints(landmarks);
    const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2;
    const { yaw, pitch } = getFaceAngle(landmarks);

    // Blink detection
    const isEyeClosed = avgEAR < 0.22;
    if (this.prevEarOpen && isEyeClosed) this.blinkDetected = true;
    this.prevEarOpen = !isEyeClosed;

    // 🆕 Screen detection (every 2nd frame to save CPU)
    if (videoElement && faceBox && this.frames.length % 2 === 0) {
      const screenCheck = detectScreenEdges(videoElement, faceBox);
      const glareCheck  = detectScreenGlare(videoElement, faceBox);

      if (screenCheck.isScreen) this.screenDetectionCount++;
      if (glareCheck.hasGlare)  this.glareDetectionCount++;
      this.totalChecks++;

      this.frames.push({
        ear:        avgEAR,
        yaw,
        pitch,
        edgeRatio:  screenCheck.edgeRatio,
        darkRatio:  screenCheck.darkRatio,
        glareRatio: glareCheck.glareRatio,
        ts:         Date.now(),
      });
    } else {
      this.frames.push({ ear: avgEAR, yaw, pitch, ts: Date.now() });
    }

    if (this.frames.length > this.MAX_FRAMES) this.frames.shift();

    if (this.frames.length >= this.MIN_FRAMES) {
      this.result = this._evaluate();
    }

    return this._getStatus();
  }

  _evaluate() {
    const ears    = this.frames.map(f => f.ear);
    const yaws    = this.frames.map(f => f.yaw);
    const pitches = this.frames.map(f => f.pitch);

    // Movement analysis
    let jitter = 0;
    for (let i = 1; i < yaws.length; i++) {
      jitter += Math.abs(yaws[i]-yaws[i-1]) + Math.abs(pitches[i]-pitches[i-1]);
    }
    const avgJitter = jitter / (yaws.length - 1);

    const avgEAR = ears.reduce((a,b) => a+b, 0) / ears.length;
    const earVar = ears.reduce((s,e) => s + Math.pow(e-avgEAR,2), 0) / ears.length;

    const yawRange   = Math.max(...yaws)   - Math.min(...yaws);
    const pitchRange = Math.max(...pitches) - Math.min(...pitches);

    // 🆕 Screen detection ratio
    const screenRatio = this.totalChecks > 0 ? this.screenDetectionCount / this.totalChecks : 0;
    const glareRatio  = this.totalChecks > 0 ? this.glareDetectionCount  / this.totalChecks : 0;

    // ── HARD REJECT for screen ──
    // Agar 40%+ frames me screen edges detect hue = phone hai
    if (screenRatio > 0.4) {
      return {
        isLive:          false,
        isPhotoDetected: true,
        rejectReason:    'phone_detected',
        score:           0,
        screenRatio,
        glareRatio,
      };
    }

    // ── HARD REJECT for glare ──
    if (glareRatio > 0.5) {
      return {
        isLive:          false,
        isPhotoDetected: true,
        rejectReason:    'screen_glare',
        score:           0,
        screenRatio,
        glareRatio,
      };
    }

    // ── Scoring ──
    let score = 0;
    let reasons = [];
    let flags = [];

    if (this.blinkDetected)                { score += 30; reasons.push('blink'); }
    if (avgJitter > 0.001)                 { score += 25; reasons.push('jitter'); } else { flags.push('still'); }
    if (earVar > 0.0003)                   { score += 20; reasons.push('ear_var'); } else { flags.push('static_eyes'); }
    if (yawRange + pitchRange > 0.01)      { score += 15; reasons.push('movement'); } else { flags.push('no_move'); }

    // Penalty for any screen detection
    if (screenRatio > 0.15) {
      score -= 30;
      flags.push('possible_screen');
    }
    if (glareRatio > 0.2) {
      score -= 20;
      flags.push('possible_glare');
    }

    // Bonus: no screen detected at all
    if (screenRatio === 0 && glareRatio < 0.1) {
      score += 15;
      reasons.push('clean_background');
    }

    return {
      isLive:          score >= this.PASS_SCORE,
      isPhotoDetected: score < 20,
      score,
      reasons,
      flags,
      screenRatio,
      glareRatio,
      rejectReason: score < this.PASS_SCORE ? 'low_score' : null,
    };
  }

  _getStatus() {
    return {
      isComplete:      this.result !== null,
      isLive:          this.result?.isLive || false,
      isPhotoDetected: this.result?.isPhotoDetected || false,
      rejectReason:    this.result?.rejectReason || null,
      score:           this.result?.score || 0,
      frameCount:      this.frames.length,
      minFrames:       this.MIN_FRAMES,
      result:          this.result,
    };
  }

  getStatusMessage() {
    if (!this.result) {
      return {
        message: `🔍 Verifying... (${this.frames.length}/${this.MIN_FRAMES})`,
        hint:    'Naturally camera dekho',
      };
    }
    if (this.result.rejectReason === 'phone_detected') {
      return { message: '📱❌ PHONE detect hua!', hint: 'Real face dikhao, photo nahi' };
    }
    if (this.result.rejectReason === 'screen_glare') {
      return { message: '✨❌ SCREEN detect hua!', hint: 'Real face dikhao' };
    }
    if (this.result.isPhotoDetected) {
      return { message: '❌ Photo detect hua!', hint: 'Real face use karo' };
    }
    if (this.result.isLive) {
      return { message: '✅ Verified!', hint: '' };
    }
    return { message: '⚠️ Verify nahi hua', hint: 'Dobara try karo' };
  }

  get isComplete()      { return this.result !== null; }
  get isLive()          { return this.result?.isLive || false; }
  get isPhotoDetected() { return this.result?.isPhotoDetected || false; }
}

export default LivenessChecker;
export { calculateEAR, getEyePoints, getFaceAngle };