// import { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate, Link } from 'react-router-dom';
// import { loginAdmin, clearError } from '../../redux/slices/authSlice';

// const AdminLogin = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { user, loading, error } = useSelector((state) => state.auth);

//   const [showPassword, setShowPassword] = useState(false);
//   const [formData, setFormData] = useState({ email: '', password: '' });

//   useEffect(() => {
//     dispatch(clearError());
//   }, [dispatch]);

//   useEffect(() => {
//     if (user && user.role === 'admin') navigate('/admin/dashboard');
//   }, [user, navigate]);

//   const handleChange = (e) =>
//     setFormData({ ...formData, [e.target.name]: e.target.value });

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     dispatch(loginAdmin(formData));
//   };

//   return (
//     <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
//       {/* ── ambient blobs ── */}
//       <div className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-[#E8590C]/[0.04] blur-[120px]" />
//       <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[#F4A261]/[0.07] blur-[100px]" />

//       {/* ── dot grid ── */}
//       <div
//         className="pointer-events-none absolute inset-0 opacity-[0.025]"
//         style={{
//           backgroundImage: 'radial-gradient(#1A1A2E 1px,transparent 1px)',
//           backgroundSize: '28px 28px',
//         }}
//       />

//       <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
//         <div className="grid w-full max-w-[1080px] overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_-12px_rgba(26,26,46,0.10)] md:grid-cols-2">

//           {/* ════════ LEFT PANEL ════════ */}
//           <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-[#1A1A2E] p-10">
//             {/* decorations */}
//             <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#E8590C]/12 blur-[90px]" />
//             <div className="absolute bottom-10 -left-10 h-52 w-52 rounded-full bg-[#F4A261]/8 blur-[70px]" />

//             {/* accent lines */}
//             <div className="absolute top-24 right-10 space-y-3 opacity-[0.07]">
//               {[28, 22, 16].map((w, i) => (
//                 <div
//                   key={i}
//                   className="h-[1px] rounded-full bg-gradient-to-r from-[#F4A261] to-transparent"
//                   style={{ width: `${w * 4}px`, marginLeft: `${i * 12}px` }}
//                 />
//               ))}
//             </div>

//             {/* brand */}
//             <div className="relative z-10">
//               <div className="mb-10 flex items-center gap-3.5">
//                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-xl shadow-orange-600/20">
//                   <svg
//                     className="h-6 w-6 text-white"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="1.5"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
//                     />
//                   </svg>
//                 </div>
//                 <div>
//                   <h2 className="text-lg font-bold text-white">AttendEase</h2>
//                   <p className="text-[10px] uppercase tracking-[0.18em] text-[#6B6B7E]">
//                     Admin Console
//                   </p>
//                 </div>
//               </div>

//               <h1 className="text-[32px] font-extrabold leading-[1.2] tracking-tight text-white">
//                 Restricted{' '}
//                 <span className="bg-gradient-to-r from-[#E8590C] to-[#F4A261] bg-clip-text text-transparent">
//                   admin access.
//                 </span>
//               </h1>

//               <p className="mt-5 max-w-xs text-[14px] leading-7 text-[#6B6B7E]">
//                 This portal is exclusively for authorised administrators.
//                 Manage employees, attendance records and system configuration
//                 from one secure place.
//               </p>

//               {/* stats */}
//               <div className="mt-10 grid grid-cols-3 gap-3">
//                 {[
//                   { val: 'Full', label: 'Control' },
//                   { val: 'Live', label: 'Analytics' },
//                   { val: '256b', label: 'Encrypted' },
//                 ].map((s) => (
//                   <div
//                     key={s.label}
//                     className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur"
//                   >
//                     <p className="text-xl font-bold text-[#F4A261]">{s.val}</p>
//                     <p className="mt-1 text-[11px] text-[#55556A]">{s.label}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* features */}
//             <div className="relative z-10 mt-8 space-y-2.5">
//               {[
//                 {
//                   t: 'Employee Management',
//                   d: 'Add, edit and manage all employee records',
//                 },
//                 {
//                   t: 'Attendance Overview',
//                   d: 'Live monitoring of daily check-ins and leaves',
//                 },
//                 {
//                   t: 'Reports & Analytics',
//                   d: 'Export detailed monthly performance reports',
//                 },
//               ].map((f, i) => (
//                 <div
//                   key={i}
//                   className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all duration-300 hover:border-[#E8590C]/20 hover:bg-white/[0.05]"
//                 >
//                   <span className="mt-[5px] h-2 w-2 flex-shrink-0 rounded-full bg-[#E8590C] ring-[3px] ring-[#E8590C]/15" />
//                   <div>
//                     <h3 className="text-[13px] font-semibold text-white/90">{f.t}</h3>
//                     <p className="mt-0.5 text-[11px] text-[#55556A]">{f.d}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* bottom accent */}
//             <div className="mt-8 h-1 w-14 rounded-full bg-gradient-to-r from-[#E8590C] to-[#F4A261]" />
//           </div>

//           {/* ════════ RIGHT PANEL ════════ */}
//           <div className="flex items-center justify-center px-6 py-10 sm:px-12">
//             <div className="w-full max-w-[400px]">

//               {/* mobile logo */}
//               <div className="mb-7 flex justify-center md:hidden">
//                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-lg shadow-orange-200/40">
//                   <svg
//                     className="h-7 w-7 text-white"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="1.5"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
//                     />
//                   </svg>
//                 </div>
//               </div>

//               {/* heading */}
//               <div className="mb-8">
//                 <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#FFF3E8] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#E8590C]">
//                   <span className="h-1.5 w-1.5 rounded-full bg-[#E8590C]" />
//                   Admin Portal
//                 </span>
//                 <h2 className="mt-1 text-[28px] font-extrabold tracking-tight text-[#1A1A2E]">
//                   Administrator Login
//                 </h2>
//                 <p className="mt-2 text-[14px] leading-relaxed text-[#9CA3AF]">
//                   Authorised personnel only. All access is logged and monitored.
//                 </p>
//               </div>

//               {/* security notice */}
//               <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#E8590C]/15 bg-[#FFF8F3] px-4 py-3.5">
//                 <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#E8590C]/10">
//                   <svg
//                     className="h-3 w-3 text-[#E8590C]"
//                     fill="none"
//                     stroke="currentColor"
//                     strokeWidth="2.5"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
//                     />
//                   </svg>
//                 </div>
//                 <p className="text-[12px] leading-5 text-[#4B5563]">
//                   <span className="font-semibold text-[#E8590C]">Restricted access.</span>{' '}
//                   This login is for administrators only. Unauthorised attempts are recorded.
//                 </p>
//               </div>

//               {/* error */}
//               {error && (
//                 <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3.5 animate-shake">
//                   <div className="flex items-start gap-3">
//                     <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
//                       <svg
//                         className="h-3 w-3 text-red-600"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="2.5"
//                         viewBox="0 0 24 24"
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//                       </svg>
//                     </div>
//                     <div>
//                       <p className="text-sm font-semibold text-red-800">Access Denied</p>
//                       <p className="mt-0.5 text-xs text-red-600">{error}</p>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <form onSubmit={handleSubmit} className="space-y-5">
//                 {/* email */}
//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
//                     Admin Email
//                   </label>
//                   <div className="group relative">
//                     <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
//                       <svg
//                         className="h-[18px] w-[18px]"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="1.5"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91A2.25 2.25 0 012.25 6.993V6.75"
//                         />
//                       </svg>
//                     </span>
//                     <input
//                       type="email"
//                       name="email"
//                       value={formData.email}
//                       onChange={handleChange}
//                       required
//                       autoComplete="email"
//                       placeholder="admin@company.com"
//                       className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]"
//                     />
//                   </div>
//                 </div>

//                 {/* password */}
//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
//                     Password
//                   </label>
//                   <div className="group relative">
//                     <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
//                       <svg
//                         className="h-[18px] w-[18px]"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="1.5"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
//                         />
//                       </svg>
//                     </span>
//                     <input
//                       type={showPassword ? 'text' : 'password'}
//                       name="password"
//                       value={formData.password}
//                       onChange={handleChange}
//                       required
//                       autoComplete="current-password"
//                       placeholder="Enter admin password"
//                       className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-16 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#9CA3AF] hover:text-[#E8590C] transition-colors"
//                     >
//                       {showPassword ? (
//                         <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
//                         </svg>
//                       ) : (
//                         <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                         </svg>
//                       )}
//                     </button>
//                   </div>
//                 </div>

//                 {/* submit */}
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="group relative mt-1 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
//                 >
//                   {/* shine */}
//                   <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-full" />

//                   {loading ? (
//                     <span className="relative flex items-center justify-center gap-2.5">
//                       <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
//                       </svg>
//                       Verifying credentials…
//                     </span>
//                   ) : (
//                     <span className="relative flex items-center justify-center gap-2">
//                       Access Admin Dashboard
//                       <svg
//                         className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
//                         fill="none"
//                         stroke="currentColor"
//                         strokeWidth="2"
//                         viewBox="0 0 24 24"
//                       >
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
//                       </svg>
//                     </span>
//                   )}
//                 </button>
//               </form>

//               {/* divider */}
//               <div className="my-7 flex items-center gap-4">
//                 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
//                 <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C0C0C0]">or</span>
//                 <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
//               </div>

//               {/* back to employee login */}
//               <Link
//                 to="/login"
//                 className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1A1A2E] transition-all duration-300 hover:border-[#E8590C]/30 hover:bg-[#FFF8F3] hover:text-[#E8590C]"
//               >
//                 <svg
//                   className="h-4 w-4"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="2"
//                   viewBox="0 0 24 24"
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
//                 </svg>
//                 Back to Employee Login
//               </Link>

//               {/* footer */}
//               <p className="mt-7 border-t border-gray-100 pt-5 text-center text-[11px] text-[#C0C0C0]">
//                 All admin sessions are encrypted and activity-logged for security.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @keyframes shake {
//           0%,100% { transform:translateX(0) }
//           10%,30%,50%,70%,90% { transform:translateX(-4px) }
//           20%,40%,60%,80% { transform:translateX(4px) }
//         }
//         .animate-shake { animation:shake .5s ease-in-out }
//       `}</style>
//     </div>
//   );
// };

// export default AdminLogin;





import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginAdmin, clearError } from '../../redux/slices/authSlice';

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // 🆕 UPDATED - Auto redirect based on admin_type
  useEffect(() => {
    if (user && user.role === 'admin') {
      // Follow-up Admin → Dashboard (only dashboard access hai)
      if (user.admin_type === 'followup') {
        navigate('/admin/dashboard');
      }
      // Leave Admin → Leaves page (assigned_manager hai to)
      else if (user.assigned_manager && user.assigned_manager.trim() !== '') {
        navigate('/admin/leaves');
      }
      // Regular Admin → Dashboard (full access)
      else {
        navigate('/admin/dashboard');
      }
    }
  }, [user, navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginAdmin(formData));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
      {/* ── ambient blobs ── */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-[#E8590C]/[0.04] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[#F4A261]/[0.07] blur-[100px]" />

      {/* ── dot grid ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(#1A1A2E 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-[1080px] overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_-12px_rgba(26,26,46,0.10)] md:grid-cols-2">

          {/* ════════ LEFT PANEL ════════ */}
          <div className="relative hidden md:flex flex-col justify-between overflow-hidden bg-[#1A1A2E] p-10">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#E8590C]/12 blur-[90px]" />
            <div className="absolute bottom-10 -left-10 h-52 w-52 rounded-full bg-[#F4A261]/8 blur-[70px]" />

            <div className="absolute top-24 right-10 space-y-3 opacity-[0.07]">
              {[28, 22, 16].map((w, i) => (
                <div
                  key={i}
                  className="h-[1px] rounded-full bg-gradient-to-r from-[#F4A261] to-transparent"
                  style={{ width: `${w * 4}px`, marginLeft: `${i * 12}px` }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="mb-10 flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-xl shadow-orange-600/20">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AttendEase</h2>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#6B6B7E]">
                    Admin Console
                  </p>
                </div>
              </div>

              <h1 className="text-[32px] font-extrabold leading-[1.2] tracking-tight text-white">
                Restricted{' '}
                <span className="bg-gradient-to-r from-[#E8590C] to-[#F4A261] bg-clip-text text-transparent">
                  admin access.
                </span>
              </h1>

              <p className="mt-5 max-w-xs text-[14px] leading-7 text-[#6B6B7E]">
                This portal is exclusively for authorised administrators.
                Manage employees, attendance records and system configuration
                from one secure place.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-3">
                {[
                  { val: 'Full', label: 'Control' },
                  { val: 'Live', label: 'Analytics' },
                  { val: '256b', label: 'Encrypted' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur"
                  >
                    <p className="text-xl font-bold text-[#F4A261]">{s.val}</p>
                    <p className="mt-1 text-[11px] text-[#55556A]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 space-y-2.5">
              {[
                {
                  t: 'Employee Management',
                  d: 'Add, edit and manage all employee records',
                },
                {
                  t: 'Attendance Overview',
                  d: 'Live monitoring of daily check-ins and leaves',
                },
                {
                  t: 'Reports & Analytics',
                  d: 'Export detailed monthly performance reports',
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all duration-300 hover:border-[#E8590C]/20 hover:bg-white/[0.05]"
                >
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

          {/* ════════ RIGHT PANEL ════════ */}
          <div className="flex items-center justify-center px-6 py-10 sm:px-12">
            <div className="w-full max-w-[400px]">

              <div className="mb-7 flex justify-center md:hidden">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-lg shadow-orange-200/40">
                  <svg
                    className="h-7 w-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
              </div>

              <div className="mb-8">
                <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#FFF3E8] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#E8590C]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E8590C]" />
                  Admin Portal
                </span>
                <h2 className="mt-1 text-[28px] font-extrabold tracking-tight text-[#1A1A2E]">
                  Administrator Login
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[#9CA3AF]">
                  Authorised personnel only. All access is logged and monitored.
                </p>
              </div>

              <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#E8590C]/15 bg-[#FFF8F3] px-4 py-3.5">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#E8590C]/10">
                  <svg
                    className="h-3 w-3 text-[#E8590C]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <p className="text-[12px] leading-5 text-[#4B5563]">
                  <span className="font-semibold text-[#E8590C]">Restricted access.</span>{' '}
                  This login is for administrators only. Unauthorised attempts are recorded.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3.5 animate-shake">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                      <svg
                        className="h-3 w-3 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-800">Access Denied</p>
                      <p className="mt-0.5 text-xs text-red-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Admin Email
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                      <svg
                        className="h-[18px] w-[18px]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91A2.25 2.25 0 012.25 6.993V6.75"
                        />
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      placeholder="admin@company.com"
                      className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-4 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1A1A2E]">
                    Password
                  </label>
                  <div className="group relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#9CA3AF] transition-colors group-focus-within:text-[#E8590C]">
                      <svg
                        className="h-[18px] w-[18px]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                      placeholder="Enter admin password"
                      className="w-full rounded-xl border border-gray-200 bg-[#FAFAFA] py-3.5 pl-12 pr-16 text-sm text-[#1A1A2E] placeholder:text-[#C0C0C0] outline-none transition-all duration-300 focus:border-[#E8590C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(232,89,12,0.08)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#9CA3AF] hover:text-[#E8590C] transition-colors"
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
                  className="group relative mt-1 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-300/50 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                  {loading ? (
                    <span className="relative flex items-center justify-center gap-2.5">
                      <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verifying credentials…
                    </span>
                  ) : (
                    <span className="relative flex items-center justify-center gap-2">
                      Access Admin Dashboard
                      <svg
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
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

              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#1A1A2E] transition-all duration-300 hover:border-[#E8590C]/30 hover:bg-[#FFF8F3] hover:text-[#E8590C]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back to Employee Login
              </Link>

              <p className="mt-7 border-t border-gray-100 pt-5 text-center text-[11px] text-[#C0C0C0]">
                All admin sessions are encrypted and activity-logged for security.
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

export default AdminLogin;