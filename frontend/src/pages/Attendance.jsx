// src/pages/Attendance.jsx

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as faceapi from '@vladmandic/face-api';
import Webcam from 'react-webcam';
import {
  markAttendance,
  clearMarkResult,
  clearAttendanceError,
  fetchTodayStatus,
} from '../redux/slices/attendanceSlice';

const Attendance = () => {
  const dispatch = useDispatch();
  const webcamRef = useRef(null);
  const { user } = useSelector((s) => s.auth);
  const { loading, markResult, error, todayStatus } = useSelector((s) => s.attendance);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('Loading...');
  const [phase, setPhase] = useState('loading');
  const [currentTime, setCurrentTime] = useState('');
  const [scanning, setScanning] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [scanningForAction, setScanningForAction] = useState(false);
  const [confirmCount, setConfirmCount] = useState(0);
  const [liveWorkingTime, setLiveWorkingTime] = useState('0h 0m');
  const [rejectCount, setRejectCount] = useState(0);   // 🆕 Track rejections

  const userFaceData = useMemo(() => {
    if (!user?.face_encoding || user.face_encoding.length === 0) return null;
    return {
      primary: new Float32Array(user.face_encoding),
      all: (user.all_encodings || []).map(e => new Float32Array(e)),
    };
  }, [user]);

  const frameBufferRef = useRef({ descriptors: [], count: 0 });

  // 🔒 STRICT SETTINGS
  const REQUIRED_FRAMES = 5;           // 🔒 More frames for accuracy
  const MATCH_THRESHOLD = 0.42;        // 🔒 Stricter (was 0.50)
  const MIN_CONFIDENCE = 70;           // 🔒 Min 70% confidence
  const SPOOF_VARIANCE_THRESHOLD = 0.005;
  const MAX_REJECTIONS = 5;            // 🆕 Auto-stop after rejections

  useEffect(() => {
    dispatch(fetchTodayStatus());
  }, [dispatch]);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (todayStatus?.status === 'in-progress' && todayStatus?.in_time) {
      const updateTimer = () => {
        const inTime = todayStatus.in_time;
        const now = new Date();
        const currentTimeStr = now.toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', hour12: true
        });

        const parseTime = (t) => {
          const [time, period] = t.split(' ');
          let [h, m] = time.split(':').map(Number);
          if (period === 'PM' && h !== 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        };

        const diff = parseTime(currentTimeStr) - parseTime(inTime);
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        setLiveWorkingTime(`${hours}h ${minutes}m`);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [todayStatus]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatusMsg('Loading face models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Model load error:', err);
        setStatusMsg('Model load failed');
        setPhase('error');
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('📍 GPS Success:', pos.coords.latitude, pos.coords.longitude);
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.error('GPS Error:', err);
          if (err.code === 1) {
            setLocationError('Location permission denied. Allow in browser settings.');
          } else if (err.code === 2) {
            setLocationError('Location unavailable. Check GPS settings.');
          } else if (err.code === 3) {
            setLocationError('Location timeout. Try in open area.');
          } else {
            setLocationError('Location error: ' + err.message);
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationError('GPS not available in this browser');
    }
  }, []);

  useEffect(() => {
    if (todayStatus?.status === 'complete') return;
    if (modelsLoaded && location && cameraReady && userFaceData) {
      const msg = todayStatus?.status === 'in-progress'
        ? 'Ready to check out'
        : 'Select CHECK IN or CHECK OUT';
      setStatusMsg(msg);
      setPhase('ready');
    } else if (!userFaceData && modelsLoaded) {
      setStatusMsg('Face not registered. Please register first.');
      setPhase('error');
    } else if (modelsLoaded && !location) {
      setStatusMsg('Getting location...');
    } else if (modelsLoaded && location && !cameraReady) {
      setStatusMsg('Starting camera...');
    }
  }, [modelsLoaded, location, cameraReady, userFaceData, todayStatus]);

  useEffect(() => {
    return () => {
      dispatch(clearMarkResult());
      dispatch(clearAttendanceError());
    };
  }, [dispatch]);

  const handleCameraStart = useCallback(() => setCameraReady(true), []);

  const euclideanDistance = (a, b) => {
    if (a.length !== b.length) return 999;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      sum += d * d;
    }
    return Math.sqrt(sum);
  };

  // 🔒 STRICT FACE MATCH
  const matchFace = useCallback((descriptor) => {
    if (!userFaceData) return { matched: false, distance: 999, confidence: 0 };

    let bestDistance = euclideanDistance(descriptor, userFaceData.primary);
    for (const enc of userFaceData.all) {
      const d = euclideanDistance(descriptor, enc);
      if (d < bestDistance) bestDistance = d;
    }

    const confidence = Math.round((1 - bestDistance) * 100);

    // 🔒 STRICT — both distance AND confidence must pass
    const matched = bestDistance < MATCH_THRESHOLD && confidence >= MIN_CONFIDENCE;

    return {
      matched,
      distance: bestDistance,
      confidence,
    };
  }, [userFaceData]);

  const checkSpoof = useCallback((descriptors) => {
    if (descriptors.length < 2) return { isSpoof: false, variance: 0 };
    let totalVariance = 0;
    for (let i = 1; i < descriptors.length; i++) {
      let frameDist = 0;
      for (let j = 0; j < descriptors[i].length; j++) {
        const d = descriptors[i][j] - descriptors[0][j];
        frameDist += d * d;
      }
      totalVariance += Math.sqrt(frameDist);
    }
    const avgVariance = totalVariance / (descriptors.length - 1);
    return { isSpoof: avgVariance < SPOOF_VARIANCE_THRESHOLD, variance: avgVariance };
  }, []);

  const scanFace = useCallback(async () => {
    if (!webcamRef.current?.video || scanning || markResult || !scanningForAction) return;
    if (!modelsLoaded || !cameraReady || !location || !userFaceData) return;

    setScanning(true);
    try {
      const video = webcamRef.current.video;
      if (video.readyState !== 4) { setScanning(false); return; }

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
          inputSize: 224, scoreThreshold: 0.5,
        }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!detection) {
        setStatusMsg('👀 Face the camera');
        setScanning(false);
        return;
      }

      if (detection.detection.score < 0.6) {
        setStatusMsg('💡 Move closer / better lighting');
        setScanning(false);
        return;
      }

      const descriptor = detection.descriptor;
      const matchResult = matchFace(descriptor);

      // 🔒 STRICT REJECTION
      if (!matchResult.matched) {
        frameBufferRef.current = { descriptors: [], count: 0 };
        setConfirmCount(0);
        setRejectCount(prev => prev + 1);

        if (matchResult.confidence < 40) {
          setStatusMsg(`❌ Yeh tumhara face nahi hai! (${matchResult.confidence}%)`);
        } else {
          setStatusMsg(`⚠️ Confidence kam: ${matchResult.confidence}% (need ${MIN_CONFIDENCE}%+)`);
        }

        // Auto-stop after too many rejections
        if (rejectCount >= MAX_REJECTIONS - 1) {
          setStatusMsg('❌ Face not recognized......');
          setPhase('error');
          setScanningForAction(false);
          setTimeout(() => {
            setStatusMsg('Select CHECK IN or CHECK OUT');
            setPhase('ready');
            setRejectCount(0);
          }, 3000);
        }

        setScanning(false);
        return;
      }

      // Reset reject count on successful match
      setRejectCount(0);

      const buf = frameBufferRef.current;
      buf.descriptors.push(Array.from(descriptor));
      buf.count += 1;
      setConfirmCount(buf.count);

      setStatusMsg(`✓ Verifying... (${buf.count}/${REQUIRED_FRAMES}) — ${matchResult.confidence}%`);

      if (buf.count >= REQUIRED_FRAMES) {
        const spoofResult = checkSpoof(buf.descriptors);

        if (spoofResult.isSpoof) {
          frameBufferRef.current = { descriptors: [], count: 0 };
          setConfirmCount(0);
          setStatusMsg('❌ Photo/screen detected. Real face dikhao.');
          setPhase('error');
          setScanningForAction(false);
          setTimeout(() => {
            setStatusMsg('Select CHECK IN or CHECK OUT');
            setPhase('ready');
          }, 3000);
          setScanning(false);
          return;
        }

        const finalDescriptor = Array.from(descriptor);
        frameBufferRef.current = { descriptors: [], count: 0 };
        setConfirmCount(0);
        setStatusMsg(`Marking ${selectedAction}...`);

        const result = await dispatch(markAttendance({
          face_encoding: finalDescriptor,
          latitude: location.latitude,
          longitude: location.longitude,
          action_type: selectedAction,
        }));

        if (result.meta.requestStatus === 'fulfilled') {
          setStatusMsg(result.payload.message);
          setPhase('done');
          setScanningForAction(false);
          dispatch(fetchTodayStatus());
        } else {
          setStatusMsg(result.payload || 'Failed');
          setPhase('error');
          setScanningForAction(false);
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
    setScanning(false);
  }, [scanning, markResult, scanningForAction, modelsLoaded, cameraReady, location, userFaceData, selectedAction, dispatch, matchFace, checkSpoof, rejectCount]);

  useEffect(() => {
    if (!scanningForAction || markResult || phase === 'done') return;
    let cancelled = false;
    const loop = async () => {
      if (cancelled) return;
      await scanFace();
      if (!cancelled) setTimeout(loop, 200);
    };
    loop();
    return () => { cancelled = true; };
  }, [scanningForAction, scanFace, markResult, phase]);

  const handleAction = (action) => {
    setSelectedAction(action);
    setScanningForAction(true);
    setRejectCount(0);
    frameBufferRef.current = { descriptors: [], count: 0 };
    setConfirmCount(0);
    setStatusMsg(`Face the camera for ${action}`);
    setPhase('scanning');
  };

  const handleCancel = () => {
    setSelectedAction(null);
    setScanningForAction(false);
    setRejectCount(0);
    frameBufferRef.current = { descriptors: [], count: 0 };
    setConfirmCount(0);
    setStatusMsg('Select CHECK IN or CHECK OUT');
    setPhase('ready');
  };

  const handleReset = () => {
    dispatch(clearMarkResult());
    dispatch(clearAttendanceError());
    dispatch(fetchTodayStatus());
    setPhase('ready');
    setSelectedAction(null);
    setScanningForAction(false);
    setConfirmCount(0);
    setRejectCount(0);
    setStatusMsg('Select CHECK IN or CHECK OUT');
    frameBufferRef.current = { descriptors: [], count: 0 };
  };

  // ════════════════════════════════════════
  // VIEW: ALREADY COMPLETE TODAY
  // ════════════════════════════════════════
  if (todayStatus?.status === 'complete' && !markResult) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
        <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
        <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
          <div className="w-full max-w-[480px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_70px_-10px_rgba(26,26,46,0.12)] animate-resultIn">

            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-6 text-center">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <svg className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-white">All Done For Today!</h2>
                <p className="mt-1 text-sm text-white/90">{user?.name} • {currentTime}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">CHECK IN</p>
                  <p className="mt-1 text-base font-extrabold text-emerald-700">{todayStatus.in_time}</p>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-[#FFF3E8] p-4 text-center">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                    <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#E8590C]">CHECK OUT</p>
                  <p className="mt-1 text-base font-extrabold text-[#E8590C]">{todayStatus.out_time}</p>
                </div>
              </div>

              <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#2A2A4E] p-5 text-center text-white">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-[#E8590C]/20 blur-2xl" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Total Working Hours</p>
                <p className="mt-2 text-4xl font-extrabold bg-gradient-to-r from-[#E8590C] to-[#F4A261] bg-clip-text text-transparent">
                  {todayStatus.working_hours}
                </p>
              </div>

              {todayStatus.in_site && (
                <div className="mb-5 rounded-xl border border-gray-200 bg-[#faf8f5] px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFF3E8] text-[#E8590C]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Site</p>
                      <p className="text-sm font-semibold text-[#1A1A2E]">{todayStatus.in_site}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          todayStatus.in_location_status === 'on-site'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          IN: {todayStatus.in_location_status === 'on-site' ? '✓ On-site' : `${todayStatus.in_distance || 0}m away`}
                        </span>
                        {todayStatus.out_location_status && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            todayStatus.out_location_status === 'on-site'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            OUT: {todayStatus.out_location_status === 'on-site' ? '✓ On-site' : `${todayStatus.out_distance || 0}m away`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-gradient-to-br from-[#FFF8F3] to-[#FFF3E8] border border-[#E8590C]/15 p-4 text-center">
                <p className="text-sm font-bold text-[#E8590C]">Great work today! 🎉</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">See you tomorrow</p>
              </div>

              <p className="mt-5 text-center text-[10px] text-[#C0C0C0]">
                Attendance already marked for {todayStatus.date}
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes resultIn { from{opacity:0;transform:translateY(20px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
          .animate-resultIn { animation:resultIn .4s ease-out }
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════
  // VIEW: NORMAL ATTENDANCE PAGE
  // ════════════════════════════════════════
  const phaseColor = {
    loading:  { accent: '#E8590C', bg: '#FFF3E8', border: '#E8590C' },
    ready:    { accent: '#E8590C', bg: '#FFF3E8', border: '#E8590C' },
    scanning: { accent: '#d97706', bg: '#fffbeb', border: '#d97706' },
    done:     { accent: '#16a34a', bg: '#f0fdf4', border: '#16a34a' },
    error:    { accent: '#dc2626', bg: '#fef2f2', border: '#dc2626' },
  };
  const cs = phaseColor[phase] || phaseColor.loading;

  const statusBadges = [
    { ok: modelsLoaded, label: 'AI Model' },
    { ok: !!location, label: 'GPS' },
    { ok: cameraReady, label: 'Camera' },
    { ok: !!userFaceData, label: 'Face' },
  ];

  const isCheckInDone = todayStatus?.status === 'in-progress' || todayStatus?.status === 'complete';
  const isCheckOutDone = todayStatus?.status === 'complete';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_70px_-10px_rgba(26,26,46,0.12)]">

          <div className="relative overflow-hidden bg-[#1A1A2E] px-6 py-5">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#E8590C]/10 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-lg shadow-orange-600/20">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-white leading-tight">{user?.name}</h2>
                  <p className="text-[11px] text-[#6B6B7E]">{user?.emp_code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-bold tabular-nums text-white">{currentTime}</p>
                <p className="text-[10px] text-[#6B6B7E]">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <div className="mt-4 h-0.5 w-full rounded-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-transparent opacity-40" />
          </div>

          <div className="p-5">

            {todayStatus?.status === 'in-progress' && !markResult && !scanningForAction && (
              <div className="mb-4 overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <div className="px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping absolute" />
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-700">Currently Working</p>
                        <p className="text-[10px] text-emerald-600">Since {todayStatus.in_time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-emerald-700 tabular-nums">{liveWorkingTime}</p>
                      <p className="text-[9px] text-emerald-600">Live</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              {statusBadges.map((s, i) => (
                <span key={i}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                    s.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'
                  }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {s.label}
                </span>
              ))}
            </div>

            {/* 🆕 Security indicator */}
            {scanningForAction && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                <p className="text-[11px] font-bold text-blue-700">
                  Secure Verification • Min {MIN_CONFIDENCE}% confidence required
                </p>
              </div>
            )}

            {locationError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="text-xs">{locationError}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mb-4 rounded-xl px-4 py-3 text-center"
              style={{ background: cs.bg, border: `1px solid ${cs.border}20` }}>
              <p className="text-sm font-semibold" style={{ color: cs.accent }}>{statusMsg}</p>
              {rejectCount > 0 && rejectCount < MAX_REJECTIONS && (
                <p className="mt-1 text-[10px] text-red-600 font-bold">
                  Rejected: {rejectCount}/{MAX_REJECTIONS}
                </p>
              )}
            </div>

            {!markResult && phase === 'ready' && !scanningForAction && (
              <div className="mb-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction('IN')}
                  disabled={isCheckInDone}
                  className="group relative overflow-hidden rounded-2xl py-5 text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: isCheckInDone
                      ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                      : 'linear-gradient(135deg, #16a34a, #22c55e)',
                    boxShadow: isCheckInDone ? 'none' : '0 8px 25px rgba(22,163,74,0.25)'
                  }}>
                  {!isCheckInDone && (
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  )}
                  <div className="relative flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      {isCheckInDone ? (
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                      )}
                    </div>
                    <span className="text-base font-extrabold tracking-wide">
                      {isCheckInDone ? 'CHECKED IN' : 'CHECK IN'}
                    </span>
                    {isCheckInDone && todayStatus?.in_time && (
                      <span className="text-[10px] text-white/80">at {todayStatus.in_time}</span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleAction('OUT')}
                  disabled={!isCheckInDone || isCheckOutDone}
                  className="group relative overflow-hidden rounded-2xl py-5 text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: (!isCheckInDone || isCheckOutDone)
                      ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
                      : 'linear-gradient(135deg, #E8590C, #D14800)',
                    boxShadow: (!isCheckInDone || isCheckOutDone) ? 'none' : '0 8px 25px rgba(232,89,12,0.25)'
                  }}>
                  {(isCheckInDone && !isCheckOutDone) && (
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  )}
                  <div className="relative flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      </svg>
                    </div>
                    <span className="text-base font-extrabold tracking-wide">CHECK OUT</span>
                    {!isCheckInDone && (
                      <span className="text-[10px] text-white/80">Check in first</span>
                    )}
                  </div>
                </button>
              </div>
            )}

            {scanningForAction && confirmCount > 0 && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-700">Verifying face...</span>
                  <span className="text-xs font-bold text-amber-700">{confirmCount}/{REQUIRED_FRAMES}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-amber-100">
                  <div className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${(confirmCount / REQUIRED_FRAMES) * 100}%` }} />
                </div>
              </div>
            )}

            {markResult && (() => {
              const isIN = markResult.type === 'IN';
              const locStatus = markResult.data?.location_status;
              const isOnSite = locStatus === 'on-site';
              const isOOR = locStatus === 'out-of-range';
              const noSite = locStatus === 'no-site-configured';
              const noGPS = locStatus === 'no-gps';

              return (
                <div className="mb-4 overflow-hidden rounded-2xl text-center animate-resultIn"
                  style={{ background: isIN ? '#f0fdf4' : '#FFF3E8', border: `1px solid ${isIN ? '#bbf7d0' : '#E8590C'}30` }}>
                  <div className="h-1 w-full" style={{ background: isIN ? '#22c55e' : '#E8590C' }} />
                  <div className="px-6 py-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-md"
                      style={{ background: isIN ? 'rgba(34,197,94,0.1)' : 'rgba(232,89,12,0.1)' }}>
                      <svg className="h-8 w-8" style={{ color: isIN ? '#16a34a' : '#E8590C' }}
                        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    <p className="text-xl font-extrabold" style={{ color: isIN ? '#16a34a' : '#E8590C' }}>
                      {isIN ? 'Checked In ✓' : 'Checked Out ✓'}
                    </p>
                    <p className="mt-1 text-sm text-[#9CA3AF]">{markResult.message}</p>

                    {markResult.data?.working_hours && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1A1A2E] px-3 py-1.5 text-xs font-bold text-white">
                        Total: {markResult.data.working_hours}
                      </div>
                    )}

                    {markResult.data?.confidence && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        🔒 Verified: {markResult.data.confidence}%
                      </div>
                    )}

                    {locStatus && (
                      <div className="mt-4 space-y-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                          style={{
                            background: isOnSite
                              ? 'rgba(34,197,94,0.1)'
                              : isOOR
                                ? 'rgba(239,68,68,0.1)'
                                : 'rgba(156,163,175,0.15)',
                            color: isOnSite ? '#16a34a' : isOOR ? '#dc2626' : '#6b7280',
                          }}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            isOnSite ? 'bg-emerald-500' : isOOR ? 'bg-red-500' : 'bg-gray-500'
                          }`} />
                          {isOnSite && '✓ On Site'}
                          {isOOR && '⚠ Out of Range'}
                          {noSite && '⚠ No Site Configured'}
                          {noGPS && '⚠ No GPS'}
                        </div>

                        {markResult.data?.site_name && !noGPS && (
                          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-left">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                              Nearest Site
                            </p>
                            <p className="text-sm font-bold text-[#1A1A2E]">
                              📍 {markResult.data.site_name}
                            </p>
                            {markResult.data?.distance > 0 && (
                              <p className="text-[11px] mt-0.5">
                                Distance: <span className={`font-bold ${isOnSite ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {markResult.data.distance}m
                                </span>
                              </p>
                            )}
                          </div>
                        )}

                        {isOOR && markResult.data?.latitude && markResult.data?.longitude && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                              Your Location
                            </p>
                            <p className="font-mono text-[11px] text-amber-900">
                              {Number(markResult.data.latitude).toFixed(6)}, {Number(markResult.data.longitude).toFixed(6)}
                            </p>
                            <a
                              href={`https://www.google.com/maps?q=${markResult.data.latitude},${markResult.data.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:underline"
                            >
                              📍 View on Google Maps →
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {!markResult && (
              <div className="relative mb-4 overflow-hidden rounded-2xl bg-[#1A1A2E]">
                <Webcam ref={webcamRef} audio={false} className="block w-full rounded-2xl"
                  videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
                  onUserMedia={handleCameraStart}
                  onUserMediaError={() => { setStatusMsg('Camera access denied'); setPhase('error'); }} />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-56 w-44 rounded-full transition-all duration-300"
                    style={{
                      border: `2px dashed ${
                        scanningForAction
                          ? selectedAction === 'IN' ? 'rgba(34,197,94,0.6)' : 'rgba(232,89,12,0.6)'
                          : 'rgba(255,255,255,0.2)'
                      }`,
                    }} />
                </div>

                {scanningForAction && selectedAction && (
                  <div className="absolute top-2 right-2 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white"
                    style={{ background: selectedAction === 'IN' ? 'rgba(22,163,74,0.85)' : 'rgba(232,89,12,0.85)' }}>
                    {selectedAction === 'IN' ? 'CHECK IN' : 'CHECK OUT'}
                  </div>
                )}

                {scanning && (
                  <div className="absolute inset-0 rounded-2xl animate-borderPulse"
                    style={{ border: `2px solid ${selectedAction === 'IN' ? 'rgba(34,197,94,0.5)' : 'rgba(232,89,12,0.5)'}` }} />
                )}
              </div>
            )}

            {scanningForAction && !markResult && (
              <button onClick={handleCancel}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-[#4B5563] transition-all hover:bg-gray-50">
                Cancel
              </button>
            )}

            {!markResult && !scanningForAction && phase === 'ready' && (
              <p className="mb-2 text-center text-[11px] text-[#C0C0C0]">
                🔒 Only your registered face will be accepted
              </p>
            )}

            {(markResult || phase === 'error') && (
              <button onClick={handleReset}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all hover:-translate-y-0.5 hover:shadow-xl">
                <span className="relative flex items-center justify-center gap-2">
                  Mark Another
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes borderPulse { 0%,100%{opacity:.3} 50%{opacity:1} }
        .animate-borderPulse { animation:borderPulse 1.5s ease-in-out infinite }
        @keyframes resultIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .animate-resultIn { animation:resultIn .35s ease-out }
      `}</style>
    </div>
  );
};

export default Attendance;