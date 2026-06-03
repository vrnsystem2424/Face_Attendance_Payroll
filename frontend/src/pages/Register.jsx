import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerEmployee, clearError, clearMessage } from '../redux/slices/authSlice';
import { fetchAllMasterData } from '../redux/slices/masterSlice';
import { fetchCompanies } from '../redux/slices/companySlice';
import getDeviceFingerprint from '../utils/deviceFingerprint';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector((state) => state.auth);
  const { departments, designations } = useSelector((state) => state.master);
  const { companies } = useSelector((state) => state.company);

  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // ── Form (no leave_approval_manager) ──
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    company_id: '',
    department: '',
    designation: '',
  });

  const [empCode, setEmpCode] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    dispatch(fetchAllMasterData());
    dispatch(fetchCompanies());
    dispatch(clearError());
    dispatch(clearMessage());

    const loadDeviceInfo = async () => {
      const fp = await getDeviceFingerprint();
      setDeviceInfo(fp);
    };
    loadDeviceInfo();

    const timer = setTimeout(() => setPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deviceInfo) {
      alert('Device info loading... please wait');
      return;
    }
    const result = await dispatch(
      registerEmployee({
        ...formData,
        device_id: deviceInfo.fingerprint,
        device_info: deviceInfo.raw_components,
      })
    );
    if (result.meta.requestStatus === 'fulfilled') {
      setEmpCode(result.payload.data.emp_code);
      localStorage.setItem('device_id', deviceInfo.fingerprint);
    }
  };

  /* ─────────────── PAGE LOADER ─────────────── */
  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-4">
        <div className="text-center">
          <div className="relative mx-auto mb-8">
            <div className="absolute inset-0 mx-auto h-24 w-24 rounded-3xl bg-[#E8590C]/10 animate-ping" />
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-2xl shadow-orange-300/40">
              <svg className="h-11 w-11 text-white" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1A2E] tracking-tight">
            Employee Registration
          </h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">Setting up secure registration…</p>
          <div className="mx-auto mt-8 h-1.5 w-52 overflow-hidden rounded-full bg-orange-100">
            <div className="h-full rounded-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C] animate-loadbar" />
          </div>
        </div>
        <style>{`
          @keyframes loadbar {
            0%   { width: 0%;   margin-left: 0 }
            50%  { width: 70%;  margin-left: 5% }
            100% { width: 100%; margin-left: 0 }
          }
          .animate-loadbar { animation: loadbar 1.2s ease-in-out }
        `}</style>
      </div>
    );
  }

  /* ─────────────── SUCCESS VIEW ─────────────── */
  if (message) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
        <div className="pointer-events-none absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.05] blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.07] blur-[90px]" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_20px_70px_-10px_rgba(26,26,46,0.10)]">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#E8590C] via-[#F4A261] to-[#E8590C]" />
              <div className="p-8 sm:p-10">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
                  <svg className="h-10 w-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <h2 className="text-center text-[26px] font-extrabold tracking-tight text-[#1A1A2E]">
                  Registration Successful!
                </h2>
                <p className="mt-2 text-center text-sm text-[#9CA3AF]">{message}</p>

                {empCode && (
                  <div className="mt-7 overflow-hidden rounded-2xl border border-[#E8590C]/20 bg-gradient-to-br from-[#FFF8F3] to-[#FFF3E8]">
                    <div className="border-b border-[#E8590C]/10 px-5 py-3">
                      <p className="text-center text-xs font-bold uppercase tracking-widest text-[#E8590C]">
                        Your Employee Code
                      </p>
                    </div>
                    <div className="px-5 py-6 text-center">
                      <p className="text-5xl font-extrabold tracking-widest text-[#1A1A2E]">{empCode}</p>
                      <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
                        <svg className="h-4 w-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <span className="text-xs font-semibold text-amber-700">
                          Save this code — required for login
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🆕 Info — Admin will approve & assign manager */}
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-blue-800">
                    Your account is pending admin approval. Manager will be assigned after approval.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#E8590C]/10">
                    <svg className="h-4 w-4 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-[#4B5563]">
                    Attendance locked to this device only
                  </p>
                </div>

                <Link
                  to="/login"
                  className="group mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300/50"
                >
                  <span>Go to Login</span>
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────── REGISTRATION FORM ─────────────── */
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
      <div className="pointer-events-none absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-[#E8590C]/[0.04] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full bg-[#F4A261]/[0.07] blur-[100px]" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'radial-gradient(#1A1A2E 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-[1120px] overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_-12px_rgba(26,26,46,0.10)] lg:grid-cols-[1fr_1.6fr]">

          {/* LEFT PANEL */}
          <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#1A1A2E] p-10">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#E8590C]/12 blur-[90px]" />
            <div className="absolute bottom-10 -left-10 h-52 w-52 rounded-full bg-[#F4A261]/8 blur-[70px]" />

            <div className="absolute top-24 right-10 space-y-3 opacity-[0.07]">
              {[28, 22, 16].map((w, i) => (
                <div key={i} className="h-[1px] rounded-full bg-gradient-to-r from-[#F4A261] to-transparent"
                  style={{ width: `${w * 4}px`, marginLeft: `${i * 12}px` }} />
              ))}
            </div>

            <div className="relative z-10">
              <div className="mb-10 flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-xl shadow-orange-600/20">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AttendEase</h2>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#6B6B7E]">New Employee</p>
                </div>
              </div>

              <h1 className="text-[32px] font-extrabold leading-[1.2] tracking-tight text-white">
                Join the team,{' '}
                <span className="bg-gradient-to-r from-[#E8590C] to-[#F4A261] bg-clip-text text-transparent">
                  get started today.
                </span>
              </h1>

              <p className="mt-5 max-w-xs text-[14px] leading-7 text-[#6B6B7E]">
                Register once, receive your unique employee code, and start
                marking attendance with secure device-locked access.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-3">
                {[
                  { val: '< 2m', label: 'Setup Time' },
                  { val: '100%', label: 'Secure' },
                  { val: '1-tap', label: 'Check-in' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur">
                    <p className="text-xl font-bold text-[#F4A261]">{s.val}</p>
                    <p className="mt-1 text-[11px] text-[#55556A]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 space-y-2.5">
              {[
                { t: 'Company-Based Setup', d: 'Pick your company to register' },
                { t: 'Device Lock Security', d: 'Attendance bound to this device only' },
                { t: 'Admin Approval', d: 'Manager will be assigned by admin' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all duration-300 hover:border-[#E8590C]/20 hover:bg-white/[0.05]">
                  <span className="mt-[5px] h-2 w-2 flex-shrink-0 rounded-full bg-[#E8590C] ring-[3px] ring-[#E8590C]/15" />
                  <div>
                    <h3 className="text-[13px] font-semibold text-white/90">{f.t}</h3>
                    <p className="mt-0.5 text-[11px] text-[#55556A]">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 h-1 w-14 rounded-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
          </div>

          {/* RIGHT PANEL — FORM */}
          <div className="flex items-start justify-center px-6 py-10 sm:px-10 lg:items-center">
            <div className="w-full max-w-[520px]">
              <div className="mb-7 flex justify-center lg:hidden">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-lg shadow-orange-200/40">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                </div>
              </div>

              <div className="mb-7">
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#FFF3E8] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#E8590C]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E8590C]" />
                  New Employee
                </span>
                <h2 className="mt-1 text-[28px] font-extrabold tracking-tight text-[#1A1A2E]">
                  Create your account
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#9CA3AF]">
                  Fill in your details to get started with the attendance system.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3.5 animate-shake">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                      <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-800">Registration failed</p>
                      <p className="mt-0.5 text-xs text-red-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* COMPANY DROPDOWN */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Select Company <span className="text-[#E8590C]">*</span>
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                      </svg>
                    </span>
                    <select
                      name="company_id"
                      value={formData.company_id}
                      onChange={handleChange}
                      required
                      className="w-full appearance-none rounded-xl border-2 border-[#E8590C]/20 bg-[#FFF8F3] py-3.5 pl-12 pr-10 text-sm font-semibold text-[#1A1A2E] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]"
                    >
                      <option value="">Choose your company</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#E8590C]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Full Name <span className="text-[#E8590C]">*</span>
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </span>
                    <input
                      type="text" name="name" value={formData.name} onChange={handleChange} required
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]"
                    />
                  </div>
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Mobile No. <span className="text-[#E8590C]">*</span>
                    </label>
                    <div className="group relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                        <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                        </svg>
                      </span>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required maxLength={10}
                        placeholder="10 digit number"
                        className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">Email</label>
                    <div className="group relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                        <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91A2.25 2.25 0 012.25 6.993V6.75" />
                        </svg>
                      </span>
                      <input type="email" name="email" value={formData.email} onChange={handleChange}
                        placeholder="Email address"
                        className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]" />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Password <span className="text-[#E8590C]">*</span>
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                      required minLength={6} placeholder="Min 6 characters"
                      className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-16 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#9CA3AF] hover:text-[#E8590C] transition-colors">
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Department + Designation */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Department <span className="text-[#E8590C]">*</span>
                    </label>
                    <div className="group relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                        <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                        </svg>
                      </span>
                      <select name="department" value={formData.department} onChange={handleChange} required
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-10 text-sm text-[#1A1A2E] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]">
                        <option value="">Select dept.</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d.value}>{d.value}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                      Designation <span className="text-[#E8590C]">*</span>
                    </label>
                    <div className="group relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                        <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </span>
                      <select name="designation" value={formData.designation} onChange={handleChange} required
                        className="w-full appearance-none rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-10 text-sm text-[#1A1A2E] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]">
                        <option value="">Select desig.</option>
                        {designations.map((d) => (
                          <option key={d._id} value={d.value}>{d.value}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 🆕 INFO BOX — Manager assigned later */}
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-900">Manager assigned after approval</p>
                    <p className="mt-0.5 text-[11px] text-blue-700">
                      Admin will review your request and assign a leave approval manager.
                    </p>
                  </div>
                </div>

                {/* Device Info */}
                <div className="flex items-center gap-3.5 rounded-xl border border-gray-200 bg-[#FAFAFA] px-4 py-3.5">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${deviceInfo ? 'bg-[#E8590C]/10' : 'bg-amber-50'}`}>
                    <svg className={`h-4 w-4 ${deviceInfo ? 'text-[#E8590C]' : 'text-amber-500'}`}
                      fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[#1A1A2E]">Device Fingerprint</p>
                      {deviceInfo ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {deviceInfo.fingerprint.substring(0, 10)}…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                          Detecting…
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                      Attendance will only work from this device
                    </p>
                  </div>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading || !deviceInfo}
                  className="group relative mt-1 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  {loading ? (
                    <span className="relative flex items-center justify-center gap-2.5">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Registering…
                    </span>
                  ) : !deviceInfo ? (
                    <span className="relative flex items-center justify-center gap-2.5">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading device…
                    </span>
                  ) : (
                    <span className="relative flex items-center justify-center gap-2">
                      Create Account
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C0C0C0]">or</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              </div>

              <Link to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1A1A2E] transition-all duration-300 hover:border-[#E8590C]/30 hover:bg-[#FFF8F3] hover:text-[#E8590C]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Already registered? Login here
              </Link>

              <p className="mt-7 border-t border-gray-100 pt-5 text-center text-[11px] text-[#C0C0C0]">
                Secure registration with device fingerprint locking for attendance verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform:translateX(0) }
          10%,30%,50%,70%,90% { transform:translateX(-4px) }
          20%,40%,60%,80% { transform:translateX(4px) }
        }
        .animate-shake { animation:shake .5s ease-in-out }
      `}</style>
    </div>
  );
};

export default Register;