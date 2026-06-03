
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as faceapi from '@vladmandic/face-api';
import Webcam from 'react-webcam';
import { loadAllFaceEncodings } from '../../redux/slices/faceSlice';
import API from '../../api/axios';

const ReceptionMode = () => {
  const dispatch = useDispatch();
  const webcamRef = useRef(null);
  const { faceData, isLoaded } = useSelector((state) => state.faces);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Loading...');
  const [lastResult, setLastResult] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [cooldown, setCooldown] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [location, setLocation] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [matchThreshold, setMatchThreshold] = useState(0.50);
  const [showSettings, setShowSettings] = useState(false);

  const confirmBufferRef = useRef({ empId: null, count: 0, distances: [], descriptors: [] });
  const CONFIRM_FRAMES = 3;
  const MIN_GAP = 0.08;
  const SPOOF_VARIANCE_THRESHOLD = 0.005;

  const precomputedFaces = useMemo(() => {
    if (!faceData || faceData.length === 0) return [];
    return faceData
      .filter(emp => emp.face_encoding && emp.face_encoding.length > 0)
      .map(emp => ({
        ...emp,
        _encoding: new Float32Array(emp.face_encoding),
        _allEncodings: (emp.all_encodings || []).map(e => new Float32Array(e)),
      }));
  }, [faceData]);

  // ── VOICE ──
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      const names = ['Zira','Heera','Susan','Google UK English Female','Google US English','Samantha','Karen','Moira','Tessa','Female'];
      let found = null;
      for (const n of names) { found = available.find(v => v.name.includes(n)); if (found) break; }
      setSelectedVoice(found || available[0] || null);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speak = useCallback((text) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (selectedVoice) u.voice = selectedVoice;
    u.lang = 'en-IN'; u.rate = 0.95; u.pitch = 1.2; u.volume = 1;
    window.speechSynthesis.speak(u);
  }, [soundEnabled, selectedVoice]);

  const playBeep = useCallback((type) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = type==='IN'?880:type==='OUT'?523:300;
      gain.gain.value = 0.25;
      osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, 180);
    } catch {}
  }, [soundEnabled]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true })), 1000);
    return () => clearInterval(t);
  }, []);

  // ── LOAD SSD MOBILENET ──
  useEffect(() => {
    const load = async () => {
      try {
        setStatusMsg('Loading face models...');
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
      } catch { setStatusMsg('Model load failed'); }
    };
    load();
  }, []);

  useEffect(() => { if (!isLoaded) dispatch(loadAllFaceEncodings()); }, [dispatch, isLoaded]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => setLocation({ latitude: 0, longitude: 0 }),
        { enableHighAccuracy: true }
      );
    } else setLocation({ latitude: 0, longitude: 0 });
  }, []);

  useEffect(() => {
    if (modelsLoaded && isLoaded && location) setStatusMsg('System ready — Step in front of the camera');
  }, [modelsLoaded, isLoaded, location]);

  // ── FACE MATCH — checks averaged + all individual encodings ──
  const findMatch = useCallback((inputDescriptor) => {
    if (precomputedFaces.length === 0) return null;
    let bestMatch = null, bestDistance = 1, secondBestDistance = 1;
    const input = new Float32Array(inputDescriptor);

    const calcDist = (saved) => {
      if (saved.length !== input.length) return 999;
      let sum = 0;
      for (let i = 0; i < saved.length; i++) { const d = saved[i] - input[i]; sum += d * d; }
      return Math.sqrt(sum);
    };

    for (const employee of precomputedFaces) {
      // Check averaged encoding
      let empBestDist = calcDist(employee._encoding);

      // Check all individual encodings — use best (lowest)
      for (const enc of employee._allEncodings) {
        const d = calcDist(enc);
        if (d < empBestDist) empBestDist = d;
      }

      if (empBestDist < bestDistance) {
        secondBestDistance = bestDistance;
        bestDistance = empBestDist;
        bestMatch = employee;
      } else if (empBestDist < secondBestDistance) {
        secondBestDistance = empBestDist;
      }
    }

    const gap = secondBestDistance - bestDistance;
    if (bestDistance < matchThreshold && bestMatch && gap >= MIN_GAP) {
      return { matched: true, employee: bestMatch, distance: bestDistance, gap, confidence: Math.round((1 - bestDistance) * 100) };
    }
    if (bestDistance < matchThreshold && gap < MIN_GAP) {
      return { matched: false, distance: bestDistance, reason: 'ambiguous' };
    }
    return { matched: false, distance: bestDistance };
  }, [precomputedFaces, matchThreshold]);

  const markAttendanceAPI = async (empId) => {
    try {
      const r = await API.post('/attendance/mark-reception', { emp_id: empId, latitude: location?.latitude||0, longitude: location?.longitude||0 });
      return r.data;
    } catch (e) { return { success: false, message: e.response?.data?.message || 'Server error' }; }
  };

  const addLog = (log) => setRecentLogs((prev) => [log, ...prev].slice(0, 30));

  // ── SCAN with SSD MobileNet ──
  const scanFace = useCallback(async () => {
    if (!webcamRef.current || !modelsLoaded || scanning || !isLoaded || cooldown) return;
    setScanning(true);
    try {
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) { setScanning(false); return; }

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const faceScore = detection.detection.score;
        if (faceScore < 0.65) { setStatusMsg('Move closer or face the camera'); setScanning(false); return; }

        const inputEncoding = Array.from(detection.descriptor);
        const matchResult = findMatch(inputEncoding);

        if (matchResult && matchResult.matched) {
          const empId = matchResult.employee._id;
          const buf = confirmBufferRef.current;
          if (buf.empId === empId) { buf.count += 1; buf.distances.push(matchResult.distance); buf.descriptors.push(inputEncoding); }
          else { buf.empId = empId; buf.count = 1; buf.distances = [matchResult.distance]; buf.descriptors = [inputEncoding]; }

          setStatusMsg(`Verifying... (${buf.count}/${CONFIRM_FRAMES})`);

          if (buf.count >= CONFIRM_FRAMES) {
            // Anti-spoof
            const descs = buf.descriptors;
            let totalVar = 0;
            for (let i = 1; i < descs.length; i++) { let fd = 0; for (let j = 0; j < descs[i].length; j++) { const d = descs[i][j]-descs[0][j]; fd += d*d; } totalVar += Math.sqrt(fd); }
            const avgVar = totalVar / (descs.length - 1);

            if (avgVar < SPOOF_VARIANCE_THRESHOLD) {
              buf.empId=null;buf.count=0;buf.distances=[];buf.descriptors=[];
              setCooldown(true);
              const log = { name:'Spoof Attempt', code:'', type:'SPOOF', message:'Photo/screen detected', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}) };
              setLastResult(log); addLog(log); setStatusMsg('Photo/screen detected'); playBeep('ERROR');
              setTimeout(() => speak('Please show your real face, not a photo'), 300);
              setTimeout(() => { setCooldown(false); setLastResult(null); setStatusMsg('Ready for next person'); }, 5000);
              setScanning(false); return;
            }

            const avgDist = buf.distances.reduce((a,b)=>a+b,0)/buf.distances.length;
            buf.empId=null;buf.count=0;buf.distances=[];buf.descriptors=[];
            setCooldown(true);

            const empName = matchResult.employee.name;
            const empCode = matchResult.employee.emp_code;
            const confidence = Math.round((1-avgDist)*100);
            setStatusMsg(`Identified: ${empName} (${confidence}%)`);

            const result = await markAttendanceAPI(matchResult.employee._id);
            if (result.success) {
              const log = { name:empName, code:empCode, type:result.type, message:result.message, confidence, time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}), site:result.data?.site_name||'' };
              setLastResult(log); addLog(log); setStatusMsg(`✓ ${result.message}`);
              playBeep(result.type);
              setTimeout(() => speak(result.type==='IN'?`Welcome ${empName}`:`Goodbye ${empName}, Have a nice day`), 300);
            } else {
              const log = { name:empName, code:empCode, type:'ERROR', message:result.message, time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}) };
              setLastResult(log); addLog(log); setStatusMsg(result.message); playBeep('ERROR');
              setTimeout(() => speak(result.message), 300);
            }
            setTimeout(() => { setCooldown(false); setLastResult(null); setStatusMsg('Ready for next person'); }, 4000);
          }
        } else {
          const buf = confirmBufferRef.current;
          if (buf.count > 0) { buf.empId=null;buf.count=0;buf.distances=[];buf.descriptors=[]; }
          if (faceScore > 0.75) {
            setCooldown(true);
            const log = { name:'Unknown', code:'', type:'UNKNOWN', message:matchResult?.reason==='ambiguous'?'Ambiguous':'Not recognized', time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}) };
            setLastResult(log); addLog(log); setStatusMsg(log.message); playBeep('ERROR');
            setTimeout(() => speak('Face not recognized'), 300);
            setTimeout(() => { setCooldown(false); setLastResult(null); setStatusMsg('Ready for next person'); }, 4000);
          }
        }
      } else {
        confirmBufferRef.current = { empId:null, count:0, distances:[], descriptors:[] };
        if (!cooldown) setStatusMsg('Waiting for face...');
      }
    } catch (err) { console.error('Scan error:', err); }
    setScanning(false);
  }, [modelsLoaded, scanning, isLoaded, cooldown, findMatch, speak, playBeep, location]);

  useEffect(() => {
    if (!modelsLoaded || !isLoaded || !location) return;
    let cancelled = false;
    const loop = async () => { if (cancelled) return; await scanFace(); if (!cancelled) setTimeout(loop, 1000); };
    loop();
    return () => { cancelled = true; };
  }, [modelsLoaded, isLoaded, location, scanFace]);

  const typeColor = (type) => {
    switch(type) {
      case 'IN': return {bg:'#064e3b',border:'#10b981',text:'#6ee7b7',accent:'#34d399'};
      case 'OUT': return {bg:'#1e3a5f',border:'#3b82f6',text:'#93c5fd',accent:'#60a5fa'};
      case 'UNKNOWN': return {bg:'#4c1d1d',border:'#ef4444',text:'#fca5a5',accent:'#f87171'};
      case 'SPOOF': return {bg:'#4c1d1d',border:'#dc2626',text:'#fca5a5',accent:'#ef4444'};
      default: return {bg:'#4a3728',border:'#f59e0b',text:'#fcd34d',accent:'#fbbf24'};
    }
  };

  const rc = lastResult ? typeColor(lastResult.type) : null;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(145deg,#0a0e17 0%,#111827 50%,#0f172a 100%)', color:'#e2e8f0', fontFamily:"'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif", display:'flex', flexDirection:'column' }}>
      {/* HEADER */}
      <div style={{ background:'rgba(15,23,42,0.9)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(148,163,184,0.1)', padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:36,height:36,borderRadius:8,background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>👁</div>
          <div><h1 style={{ margin:0,fontSize:18,fontWeight:700 }}>FaceAttend</h1><p style={{ margin:0,fontSize:11,color:'#64748b' }}>Reception System</p></div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ display:'flex',gap:6 }}>
            {[{ok:modelsLoaded,label:'AI'},{ok:isLoaded,label:`${precomputedFaces.length}`},{ok:!!location,label:'GPS'}].map((s,i)=>(<span key={i} style={{ fontSize:10,padding:'3px 8px',borderRadius:20,background:s.ok?'rgba(34,197,94,0.15)':'rgba(239,68,68,0.15)',color:s.ok?'#4ade80':'#f87171',border:`1px solid ${s.ok?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`,fontWeight:600 }}>{s.label}</span>))}
          </div>
          <button onClick={()=>setSoundEnabled(!soundEnabled)} style={{ background:soundEnabled?'rgba(34,197,94,0.15)':'rgba(100,116,139,0.15)',border:`1px solid ${soundEnabled?'rgba(34,197,94,0.3)':'rgba(100,116,139,0.3)'}`,color:soundEnabled?'#4ade80':'#94a3b8',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:14 }}>{soundEnabled?'🔊':'🔇'}</button>
          <button onClick={()=>setShowSettings(!showSettings)} style={{ background:'rgba(100,116,139,0.15)',border:'1px solid rgba(100,116,139,0.3)',color:'#94a3b8',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:14 }}>⚙</button>
          <div style={{ fontSize:22,fontWeight:700,fontVariantNumeric:'tabular-nums',color:'#e2e8f0' }}>{currentTime}</div>
        </div>
      </div>

      {showSettings && (
        <div style={{ background:'rgba(15,23,42,0.95)',borderBottom:'1px solid rgba(148,163,184,0.1)',padding:'16px 24px',display:'flex',gap:24,alignItems:'center',flexWrap:'wrap' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:12,color:'#94a3b8' }}>Threshold:</span>
            <span style={{ fontSize:12,color:'#60a5fa',fontWeight:600 }}>Strict</span>
            <input type="range" min="35" max="60" value={matchThreshold*100} onChange={e=>setMatchThreshold(e.target.value/100)} style={{ width:100,accentColor:'#3b82f6' }} />
            <span style={{ fontSize:12,color:'#f59e0b',fontWeight:600 }}>Relaxed</span>
            <span style={{ fontSize:12,fontWeight:700,color:'#e2e8f0',background:'rgba(59,130,246,0.2)',padding:'2px 8px',borderRadius:6 }}>{matchThreshold.toFixed(2)}</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:12,color:'#94a3b8' }}>Voice:</span>
            <select value={selectedVoice?.name||''} onChange={e=>setSelectedVoice(voices.find(v=>v.name===e.target.value))} style={{ background:'#1e293b',color:'#e2e8f0',border:'1px solid rgba(148,163,184,0.2)',borderRadius:6,padding:'4px 8px',fontSize:12,maxWidth:200 }}>
              {voices.map((v,i)=><option key={i} value={v.name}>{v.name}</option>)}
            </select>
            <button onClick={()=>speak('Welcome!')} style={{ background:'rgba(139,92,246,0.2)',border:'1px solid rgba(139,92,246,0.3)',color:'#a78bfa',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:12 }}>Test</button>
          </div>
        </div>
      )}

      <div style={{ flex:1,display:'flex',overflow:'hidden' }}>
        <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,gap:20 }}>
          <div style={{ fontSize:18,fontWeight:600,color:rc?rc.accent:'#94a3b8',textAlign:'center' }}>{statusMsg}</div>
          <div style={{ position:'relative',width:'100%',maxWidth:640,borderRadius:16,overflow:'hidden',boxShadow:cooldown&&rc?`0 0 40px ${rc.border}30`:'0 4px 30px rgba(0,0,0,0.4)' }}>
            <Webcam ref={webcamRef} audio={false} style={{ width:'100%',display:'block',borderRadius:16 }} videoConstraints={{ width:1280,height:720,facingMode:'user' }} onUserMediaError={()=>setStatusMsg('Camera denied')} />
            {scanning&&!cooldown&&<div style={{ position:'absolute',inset:0,border:'2px solid rgba(96,165,250,0.5)',borderRadius:16,animation:'pulse 1.5s ease-in-out infinite' }}/>}
            {cooldown&&rc&&<div style={{ position:'absolute',inset:0,border:`3px solid ${rc.border}`,borderRadius:16 }}/>}
            {!cooldown&&['top-left','top-right','bottom-left','bottom-right'].map(pos=>{const t=pos.includes('top'),l=pos.includes('left');return<div key={pos} style={{ position:'absolute',[t?'top':'bottom']:12,[l?'left':'right']:12,width:24,height:24,borderTop:t?'2px solid rgba(96,165,250,0.6)':'none',borderBottom:!t?'2px solid rgba(96,165,250,0.6)':'none',borderLeft:l?'2px solid rgba(96,165,250,0.6)':'none',borderRight:!l?'2px solid rgba(96,165,250,0.6)':'none' }}/>})}
          </div>
          {lastResult&&rc&&(
            <div style={{ width:'100%',maxWidth:640,background:rc.bg,border:`1px solid ${rc.border}`,borderRadius:16,padding:'28px 32px',textAlign:'center',animation:'slideUp 0.3s ease' }}>
              <p style={{ fontSize:40,fontWeight:800,margin:'0 0 8px',color:rc.accent }}>{lastResult.type==='IN'?'Welcome':lastResult.type==='OUT'?'Goodbye':lastResult.type==='SPOOF'?'Spoof Detected':'Not Recognized'}</p>
              <p style={{ fontSize:28,fontWeight:700,margin:'0 0 8px',color:'#f1f5f9' }}>{lastResult.name}</p>
              {lastResult.confidence&&<p style={{ fontSize:13,color:rc.text }}>Confidence: {lastResult.confidence}%</p>}
              {lastResult.type==='SPOOF'&&<p style={{ fontSize:14,color:rc.text,marginTop:8 }}>Photos and screens are not allowed</p>}
              {lastResult.type==='UNKNOWN'&&<p style={{ fontSize:14,color:rc.text,marginTop:8 }}>Contact admin for registration</p>}
              {!['UNKNOWN','SPOOF'].includes(lastResult.type)&&<p style={{ fontSize:16,color:'#94a3b8',marginTop:4 }}>{lastResult.time}</p>}
              {lastResult.site&&<p style={{ fontSize:12,color:'#64748b',marginTop:4 }}>📍 {lastResult.site}</p>}
            </div>
          )}
        </div>
        <div style={{ width:320,background:'rgba(15,23,42,0.6)',borderLeft:'1px solid rgba(148,163,184,0.08)',padding:20,overflowY:'auto' }}>
          <h3 style={{ margin:'0 0 16px',fontSize:14,fontWeight:600,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em' }}>Activity ({recentLogs.length})</h3>
          {recentLogs.length===0?<p style={{ color:'#475569',fontSize:13,textAlign:'center',padding:'40px 0' }}>No activity</p>:(
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {recentLogs.map((log,i)=>{const lc=typeColor(log.type);return(
                <div key={i} style={{ background:`${lc.bg}80`,border:`1px solid ${lc.border}40`,borderRadius:10,padding:'10px 12px' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                    <div><p style={{ margin:0,fontSize:13,fontWeight:600,color:'#e2e8f0' }}>{log.name}</p><p style={{ margin:'2px 0 0',fontSize:11,color:'#64748b' }}>{log.code||'Unregistered'}</p>{log.site&&<p style={{ margin:'2px 0 0',fontSize:11,color:'#64748b' }}>📍 {log.site}</p>}</div>
                    <div style={{ textAlign:'right' }}><span style={{ fontSize:10,fontWeight:700,color:lc.accent,background:lc.bg,padding:'2px 8px',borderRadius:6,border:`1px solid ${lc.border}50` }}>{log.type}</span><p style={{ margin:'4px 0 0',fontSize:11,color:'#64748b' }}>{log.time}</p></div>
                  </div>
                </div>
              );})}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}input[type=range]{height:4px;border-radius:2px}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(148,163,184,.2);border-radius:2px}`}</style>
    </div>
  );
};

export default ReceptionMode;