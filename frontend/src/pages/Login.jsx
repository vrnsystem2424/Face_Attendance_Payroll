import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginEmployee, clearError } from '../redux/slices/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  const [pageLoading, setPageLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    dispatch(clearError());
    const timer = setTimeout(() => setPageLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // ── 🔧 UPDATED — Role-based redirect ──
 useEffect(() => {
  if (user) {
    if (user.role === 'super_admin') {
      navigate('/super-admin/dashboard');
    } else if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else if (user.role === 'manager') {
      navigate('/manager/dashboard');
    } else if (user.face_registered === false) {
      navigate('/face-register');
    } else {
      navigate('/dashboard');    // 🔧 Changed from /attendance
    }
  }
}, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginEmployee(formData));
  };

  // ──────────────── PAGE LOADER ────────────────
  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-4">
        <div className="text-center">
          <div className="mx-auto mb-8 relative">
            <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-xl shadow-orange-200/60 flex items-center justify-center animate-pulse">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <div className="absolute inset-0 mx-auto h-20 w-20 rounded-2xl bg-[#E8590C]/20 animate-ping"></div>
          </div>

          <h1 className="text-2xl font-bold text-[#1A1A2E]">Attendance System</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Preparing your workspace...</p>

          <div className="mt-8 mx-auto w-48 h-1.5 bg-orange-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#E8590C] to-[#F4A261] rounded-full animate-loading-bar"></div>
          </div>
        </div>

        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
          .animate-loading-bar {
            animation: loading-bar 1.2s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  // ──────────────── LOGIN PAGE ────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#E8590C]/5 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#F4A261]/8 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1A1A2E]/[0.02] rounded-full blur-3xl"></div>

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(#1A1A2E 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }}></div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-[1100px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_70px_-10px_rgba(26,26,46,0.12)] md:grid-cols-[1.1fr_1fr]">

          {/* LEFT PANEL — same as before */}
          <div className="hidden md:flex flex-col justify-between bg-[#1A1A2E] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8590C]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F4A261]/8 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

            <div className="absolute top-20 right-10 opacity-10">
              <div className="w-32 h-[1px] bg-gradient-to-r from-[#E8590C] to-transparent mb-3 ml-8"></div>
              <div className="w-24 h-[1px] bg-gradient-to-r from-[#F4A261] to-transparent mb-3 ml-4"></div>
              <div className="w-20 h-[1px] bg-gradient-to-r from-[#E8590C] to-transparent mb-3"></div>
            </div>

            <div className="relative z-10">
              <div className="mb-10 inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-lg shadow-orange-500/20">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">AttendEase</h2>
                  <p className="text-xs text-gray-400 tracking-wide uppercase">Workforce Management</p>
                </div>
              </div>

              <h1 className="text-[32px] font-bold leading-[1.2] text-white">
                Streamline your
                <span className="block mt-1 bg-gradient-to-r from-[#E8590C] to-[#F4A261] bg-clip-text text-transparent">
                  workforce management
                </span>
              </h1>

              <p className="mt-5 text-[15px] leading-7 text-gray-400 max-w-sm">
                Track attendance, manage leaves, monitor performance — all from one unified dashboard built for modern teams.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white/5 border border-white/[0.06] p-4 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-[#F4A261]">98%</p>
                  <p className="mt-1 text-xs text-gray-500">Accuracy Rate</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/[0.06] p-4 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-[#F4A261]">2.5k</p>
                  <p className="mt-1 text-xs text-gray-500">Active Users</p>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/[0.06] p-4 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-[#F4A261]">24/7</p>
                  <p className="mt-1 text-xs text-gray-500">Uptime</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-10 space-y-3">
              {[
                { title: 'Smart Attendance', desc: 'Face recognition powered check-in & check-out' },
                { title: 'Real-time Analytics', desc: 'Live dashboards with performance insights' },
                { title: 'Leave Management', desc: 'Streamlined approval workflows' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 transition-all duration-300 hover:bg-white/[0.07]">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-[#E8590C] ring-4 ring-[#E8590C]/10 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 h-1 w-16 rounded-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]"></div>
          </div>

          {/* RIGHT PANEL — LOGIN FORM */}
          <div className="flex items-center justify-center p-8 sm:p-12">
            <div className="w-full max-w-[400px]">
              <div className="mb-6 md:hidden flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-lg shadow-orange-200/40">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
              </div>

              <div className="mb-8">
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#FFF3E8] px-3.5 py-1.5 text-xs font-semibold text-[#E8590C] tracking-wide uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E8590C]"></span>
                  Employee & Manager Portal
                </div>
                <h2 className="text-[28px] font-bold tracking-tight text-[#1A1A2E]">Welcome back</h2>
                <p className="mt-2 text-[15px] text-[#6B7280] leading-relaxed">
                  Sign in to your account to continue
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 px-4 py-3.5 animate-shake">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800">Login Failed</p>
                      <p className="text-xs text-red-600 mt-0.5">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Email Address
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91A2.25 2.25 0 012.25 6.993V6.75" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      placeholder="name@company.com"
                      className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-4 text-[#1A1A2E] text-sm placeholder:text-[#C0C0C0] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-[#1A1A2E]">Password</label>
                    <button type="button" className="text-xs font-medium text-[#E8590C] hover:text-[#D14800] transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="group relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-16 text-[#1A1A2E] text-sm placeholder:text-[#C0C0C0] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold text-[#6B7280] hover:text-[#E8590C] transition-colors uppercase tracking-wide"
                    >
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

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-4 py-3.5 font-semibold text-white shadow-lg shadow-orange-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-300/50 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                  {loading ? (
                    <span className="relative flex items-center justify-center gap-2.5">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="relative flex items-center justify-center gap-2">
                      Sign in to Dashboard
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>

              <div className="my-8 flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                <span className="text-xs text-[#9CA3AF] font-medium">OR</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              </div>

              {/* 🔧 UPDATED — 3 links instead of 2 */}
              <div className="space-y-3">
                <Link
                  to="/register"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1A1A2E] transition-all duration-300 hover:border-[#E8590C]/30 hover:bg-[#FFF8F3] hover:text-[#E8590C]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  Create New Account
                </Link>

                <Link
                  to="/admin/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1A1A2E] transition-all duration-300 hover:border-[#1A1A2E]/30 hover:bg-[#1A1A2E] hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Admin Login
                </Link>

                {/* 🆕 Super Admin Link */}
                <Link
                  to="/super-admin/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1A1A2E] transition-all duration-300 hover:border-[#E8590C]/30 hover:bg-gradient-to-r hover:from-[#E8590C] hover:to-[#D14800] hover:text-white hover:border-transparent"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  Super Admin Login
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-[#9CA3AF]">
                  Protected by enterprise-grade security
                </p>
                <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-[#C0C0C0]">
                  <span>Privacy Policy</span>
                  <span className="h-1 w-1 rounded-full bg-[#D1D5DB]"></span>
                  <span>Terms of Service</span>
                  <span className="h-1 w-1 rounded-full bg-[#D1D5DB]"></span>
                  <span>Help</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;