import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { registerFace, clearFaceError, clearFaceMessage } from '../redux/slices/faceSlice';
import { getBestCameraConfig, enhanceCameraStream } from '../utils/cameraConfig';

const CAPTURE_STEPS = [
  { id: 0, instruction: 'Look straight at the camera', icon: '😐', direction: 'Center' },
  { id: 1, instruction: 'Slowly turn head slightly LEFT', icon: '👈', direction: 'Left' },
  { id: 2, instruction: 'Slowly turn head slightly RIGHT', icon: '👉', direction: 'Right' },
  { id: 3, instruction: 'Tilt head slightly UP', icon: '👆', direction: 'Up' },
  { id: 4, instruction: 'Look straight again — final', icon: '😐', direction: 'Center' },
];

const MIN_FACE_SCORE = 0.70;
const REQUIRED_FRAMES = CAPTURE_STEPS.length;

const FaceRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const { loading, error } = useSelector((s) => s.faces);
  const { user } = useSelector((s) => s.auth);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [statusMsg, setStatusMsg] = useState('Loading face models...');
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedEncodings, setCapturedEncodings] = useState([]);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [faceVisible, setFaceVisible] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [previewQuality, setPreviewQuality] = useState(null);
  const [cameraConfig, setCameraConfig] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraResolution, setCameraResolution] = useState('');

  const countdownRef = useRef(null);

  useEffect(() => {
    const loadCamera = async () => {
      const config = await getBestCameraConfig();
      setCameraConfig(config);
    };
    loadCamera();
  }, []);

  const handleCameraStart = useCallback(async () => {
    setCameraReady(true);
    setTimeout(async () => {
      await enhanceCameraStream(webcamRef);
      if (webcamRef.current?.video) {
        const v = webcamRef.current.video;
        setCameraResolution(`${v.videoWidth}x${v.videoHeight}`);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatusMsg('Loading face recognition models...');
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
        setStatusMsg('Models ready — Start registration when ready');
      } catch (err) {
        setStatusMsg('Failed to load models: ' + err.message);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // live face preview
  useEffect(() => {
    if (!modelsLoaded || phase === 'saving' || phase === 'done' || !cameraReady) return;
    let cancelled = false;
    const checkFace = async () => {
      if (cancelled || !webcamRef.current?.video) return;
      const video = webcamRef.current.video;
      if (video.readyState !== 4) return;
      try {
        const detection = await faceapi.detectSingleFace(
          video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
        );
        if (!cancelled) {
          if (detection) {
            setFaceVisible(true);
            const s = detection.score;
            setPreviewQuality(s > 0.85 ? 'excellent' : s > 0.70 ? 'good' : 'poor');
          } else { setFaceVisible(false); setPreviewQuality(null); }
        }
      } catch {}
    };
    const interval = setInterval(checkFace, 600);
    return () => { cancelled = true; clearInterval(interval); };
  }, [modelsLoaded, phase, cameraReady]);

  const startCapture = useCallback(() => {
    setCapturedEncodings([]); setCurrentStep(0); setCaptureProgress(0);
    setPhase('capturing'); setStatusMsg(CAPTURE_STEPS[0].instruction);
  }, []);

  const captureFrame = useCallback(async () => {
    if (!webcamRef.current?.video || phase !== 'capturing') return;
    const video = webcamRef.current.video;
    if (video.readyState !== 4) { setStatusMsg('Camera not ready'); return; }
    setStatusMsg('Capturing...');
    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) { setStatusMsg('No face detected — adjust position'); return; }
      if (detection.detection.score < MIN_FACE_SCORE) { setStatusMsg('Face not clear — improve lighting'); return; }
      const encoding = Array.from(detection.descriptor);
      const newEncodings = [...capturedEncodings, encoding];
      setCapturedEncodings(newEncodings);
      setCaptureProgress(newEncodings.length);
      const nextStep = currentStep + 1;
      if (nextStep >= REQUIRED_FRAMES) {
        setPhase('saving'); setStatusMsg('All captured! Saving to server...');
        await saveEncodings(newEncodings);
      } else { setCurrentStep(nextStep); setStatusMsg(CAPTURE_STEPS[nextStep].instruction); }
    } catch { setStatusMsg('Capture failed — try again'); }
  }, [phase, capturedEncodings, currentStep]);

  const startAutoCapture = useCallback(() => {
    if (phase !== 'capturing') return;
    let count = 3; setCountdown(count);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        setCountdown(null);
        captureFrame();
      } else setCountdown(count);
    }, 1000);
  }, [phase, captureFrame]);

  const saveEncodings = async (encodings) => {
    try {
      const len = encodings[0].length;
      const averaged = new Array(len).fill(0);
      for (const enc of encodings) { for (let i = 0; i < len; i++) averaged[i] += enc[i]; }
      for (let i = 0; i < len; i++) averaged[i] /= encodings.length;
      const result = await dispatch(registerFace({
        encoding: averaged,
        all_encodings: encodings,
        capture_count: encodings.length,
      }));
      if (result.meta.requestStatus === 'fulfilled') {
        setPhase('done'); setStatusMsg('Face registered successfully!');
        const savedUser = JSON.parse(localStorage.getItem('user'));
        if (savedUser) { savedUser.face_registered = true; localStorage.setItem('user', JSON.stringify(savedUser)); }
        setTimeout(() => navigate('/attendance'), 3000);
      } else { setPhase('error'); setStatusMsg('Save failed — try again'); }
    } catch { setPhase('error'); setStatusMsg('Server error — try again'); }
  };

  const resetCapture = () => {
    setCapturedEncodings([]); setCurrentStep(0); setCaptureProgress(0);
    setCountdown(null); setPhase('idle'); setStatusMsg('Ready to start again');
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const phaseStyle = {
    idle:      { accent: '#E8590C', bg: '#FFF3E8', border: '#E8590C' },
    capturing: { accent: '#d97706', bg: '#fffbeb', border: '#d97706' },
    saving:    { accent: '#E8590C', bg: '#FFF3E8', border: '#E8590C' },
    done:      { accent: '#16a34a', bg: '#f0fdf4', border: '#16a34a' },
    error:     { accent: '#dc2626', bg: '#fef2f2', border: '#dc2626' },
  };
  const ps = phaseStyle[phase] || phaseStyle.idle;

  const qualityConfig = {
    excellent: { color: '#16a34a', bg: 'rgba(34,197,94,0.12)', label: 'Excellent ✓' },
    good:      { color: '#d97706', bg: 'rgba(217,119,6,0.12)',  label: 'Good' },
    poor:      { color: '#dc2626', bg: 'rgba(220,38,38,0.12)', label: 'Poor — Move closer' },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
      {/* blobs */}
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'radial-gradient(#1A1A2E 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-[520px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_70px_-10px_rgba(26,26,46,0.12)]">

          {/* ── Header ── */}
          <div className="relative overflow-hidden bg-[#1A1A2E] px-6 py-6 text-center">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#E8590C]/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#F4A261]/8 blur-xl" />
            <div className="relative z-10">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-xl shadow-orange-600/20">
                <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="text-lg font-extrabold text-white">Face Registration</h2>
              <p className="mt-1 text-[13px] text-[#6B6B7E]">{user?.name || 'Employee'}</p>
            </div>
            <div className="mt-4 h-0.5 w-full rounded-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-transparent opacity-40" />
          </div>

          <div className="p-6">

            {/* ── Status ── */}
            <div
              className="mb-5 rounded-xl px-4 py-3 text-center"
              style={{ background: ps.bg, border: `1px solid ${ps.border}20` }}
            >
              <p className="text-sm font-semibold" style={{ color: ps.accent }}>{statusMsg}</p>
            </div>

            {/* ── Progress Steps ── */}
            {phase === 'capturing' && (
              <div className="mb-5">
                <div className="mb-3 flex justify-between">
                  {CAPTURE_STEPS.map((step, i) => (
                    <div key={step.id} className="flex flex-col items-center gap-1.5">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
                        style={{
                          background: i < captureProgress ? '#E8590C' : i === currentStep ? '#1A1A2E' : '#F5F5FA',
                          color: i <= currentStep ? '#fff' : '#9CA3AF',
                          boxShadow: i === currentStep ? '0 4px 12px rgba(26,26,46,0.2)' : 'none',
                        }}
                      >
                        {i < captureProgress ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : step.icon}
                      </div>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wide"
                        style={{ color: i === currentStep ? '#E8590C' : '#C0C0C0' }}
                      >
                        {step.direction}
                      </span>
                    </div>
                  ))}
                </div>
                {/* progress bar */}
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(captureProgress / REQUIRED_FRAMES) * 100}%`,
                      background: 'linear-gradient(90deg, #E8590C, #F4A261)',
                    }}
                  />
                </div>
                <p className="mt-2 text-right text-[11px] font-semibold text-[#9CA3AF]">
                  {captureProgress}/{REQUIRED_FRAMES} captured
                </p>
              </div>
            )}

            {/* ── Camera ── */}
            {cameraConfig ? (
              <div className="relative mb-5 overflow-hidden rounded-2xl bg-[#1A1A2E]">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  className="block w-full rounded-2xl"
                  videoConstraints={cameraConfig}
                  onUserMedia={handleCameraStart}
                  onUserMediaError={() => setStatusMsg('Camera access denied')}
                  imageSmoothing
                />

                {/* face oval */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className="h-64 w-48 rounded-full transition-all duration-300"
                    style={{
                      border: `2.5px dashed ${
                        faceVisible ? 'rgba(232,89,12,0.7)' : 'rgba(255,255,255,0.15)'
                      }`,
                    }}
                  />
                </div>

                {/* resolution */}
                {cameraResolution && (
                  <div className="absolute top-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-bold text-[#4ade80]">
                    {cameraResolution}
                  </div>
                )}

                {/* quality badge */}
                {faceVisible && previewQuality && qualityConfig[previewQuality] && (
                  <div
                    className="absolute top-2 right-2 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-sm"
                    style={{
                      background: qualityConfig[previewQuality].bg,
                      color: qualityConfig[previewQuality].color,
                    }}
                  >
                    {qualityConfig[previewQuality].label}
                  </div>
                )}

                {/* no face */}
                {!faceVisible && cameraReady && phase !== 'done' && phase !== 'saving' && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-red-500/85 px-4 py-1.5 text-[11px] font-bold text-white whitespace-nowrap">
                    No face detected — position in oval
                  </div>
                )}

                {/* countdown */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-7xl font-extrabold text-white drop-shadow-xl">{countdown}</span>
                  </div>
                )}

                {/* direction hint */}
                {phase === 'capturing' && countdown === null && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-[11px] font-bold text-white whitespace-nowrap"
                    style={{ background: 'rgba(26,26,46,0.85)' }}>
                    {CAPTURE_STEPS[currentStep]?.icon} {CAPTURE_STEPS[currentStep]?.instruction}
                  </div>
                )}

                {/* done overlay */}
                {phase === 'done' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-emerald-600/70">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                      <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <span className="text-lg font-extrabold text-white">Registered!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-5 flex flex-col items-center justify-center rounded-2xl bg-gray-50 py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8590C]/20 border-t-[#E8590C]" />
                <p className="mt-3 text-sm text-[#9CA3AF]">Loading camera…</p>
              </div>
            )}

            {/* ── Action Buttons ── */}
            <div className="flex gap-3">
              {phase === 'idle' && (
                <button
                  onClick={startCapture}
                  disabled={!modelsLoaded || !cameraReady}
                  className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center justify-center gap-2">
                    {!cameraReady ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Camera loading…
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                        Start Registration
                      </>
                    )}
                  </span>
                </button>
              )}

              {phase === 'capturing' && countdown === null && (
                <>
                  <button
                    onClick={startAutoCapture}
                    disabled={!faceVisible || previewQuality === 'poor'}
                    className="group relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/40 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative flex items-center justify-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      </svg>
                      Capture ({currentStep + 1}/{REQUIRED_FRAMES})
                    </span>
                  </button>

                  <button
                    onClick={resetCapture}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-[#4B5563] transition-all hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </>
              )}

              {phase === 'saving' && (
                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FFF3E8] py-3.5 text-sm font-semibold text-[#E8590C]">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving to server…
                </div>
              )}

              {phase === 'error' && (
                <button
                  onClick={resetCapture}
                  className="flex-1 rounded-xl bg-red-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-red-600"
                >
                  Try Again
                </button>
              )}

              {phase === 'done' && (
                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3.5 text-sm font-bold text-emerald-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Redirecting to Attendance…
                </div>
              )}
            </div>

            {/* ── Tips (idle only) ── */}
            {phase === 'idle' && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-[#E8590C]/15 bg-[#FFF8F3]">
                <div className="border-b border-[#E8590C]/10 px-4 py-3">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#E8590C]">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    Tips for best results
                  </p>
                </div>
                <div className="space-y-2 p-4">
                  {[
                    'Good, even lighting on your face',
                    'Remove glasses if possible',
                    'Face camera directly to start',
                    'Follow direction prompts during capture',
                    '5 captures from different angles for accuracy',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#E8590C]" />
                      <p className="text-xs text-[#4B5563]">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* error message */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRegister;