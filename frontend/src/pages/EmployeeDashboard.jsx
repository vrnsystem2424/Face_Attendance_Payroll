
// import { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Link, useNavigate } from 'react-router-dom';
// import {
//   fetchTodayStatus,
//   fetchMonthlySummary,
//   fetchCalendar,
// } from '../redux/slices/attendanceSlice';
// import { fetchMyLeaves } from '../redux/slices/leaveSlice';
// import { fetchMyBalance } from '../redux/slices/leaveBalanceSlice';

// const EmployeeDashboard = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { user } = useSelector((s) => s.auth);
//   const { todayStatus, monthlySummary, calendar } = useSelector((s) => s.attendance);
//   const { myLeaves } = useSelector((s) => s.leaves);
//   const { myBalance } = useSelector((s) => s.leaveBalance);
//   const now = new Date();
//   const [month, setMonth] = useState(now.getMonth() + 1);
//   const [year, setYear] = useState(now.getFullYear());
//   const [currentTime, setCurrentTime] = useState('');
//   const [liveWorkingTime, setLiveWorkingTime] = useState('0h 0m');

//   // 🔧 FIXED - IST Time Clock
//   useEffect(() => {
//     const t = setInterval(() => {
//       setCurrentTime(new Date().toLocaleTimeString('en-IN', {
//         hour: '2-digit',
//         minute: '2-digit',
//         second: '2-digit',
//         hour12: true,
//         timeZone: 'Asia/Kolkata',
//       }));
//     }, 1000);
//     return () => clearInterval(t);
//   }, []);

//   useEffect(() => {
//     dispatch(fetchTodayStatus());
//     dispatch(fetchMyLeaves());
//     dispatch(fetchMyBalance());
//   }, [dispatch]);

//   useEffect(() => {
//     dispatch(fetchMonthlySummary({ month, year }));
//     dispatch(fetchCalendar({ month, year }));
//   }, [dispatch, month, year]);

//   // 🔧 FIXED - Live Working Timer with IST
//   useEffect(() => {
//     if (todayStatus?.status === 'in-progress' && todayStatus?.in_time) {
//       const updateTimer = () => {
//         const inTime = todayStatus.in_time;

//         const nowStr = new Date().toLocaleTimeString('en-IN', {
//           hour: '2-digit',
//           minute: '2-digit',
//           hour12: true,
//           timeZone: 'Asia/Kolkata',
//         });

//         const parseTime = (t) => {
//           const [time, period] = t.split(' ');
//           let [h, m] = time.split(':').map(Number);
//           if (period === 'PM' && h !== 12) h += 12;
//           if (period === 'AM' && h === 12) h = 0;
//           return h * 60 + m;
//         };

//         let diff = parseTime(nowStr) - parseTime(inTime);

//         if (diff < 0) diff = 0;
//         if (diff > 24 * 60) diff = 0;

//         const hours = Math.floor(diff / 60);
//         const minutes = diff % 60;
//         setLiveWorkingTime(`${hours}h ${minutes}m`);
//       };
//       updateTimer();
//       const interval = setInterval(updateTimer, 60000);
//       return () => clearInterval(interval);
//     }
//   }, [todayStatus]);

//   // Greeting based on IST time
//   const greeting = () => {
//     const istHour = parseInt(new Date().toLocaleString('en-US', {
//       hour: 'numeric',
//       hour12: false,
//       timeZone: 'Asia/Kolkata'
//     }));
//     if (istHour < 12) return 'Good Morning';
//     if (istHour < 17) return 'Good Afternoon';
//     return 'Good Evening';
//   };

//   const pendingLeaves = (myLeaves || []).filter(l => l.status === 'pending').length;

//   const statCards = [
//     {
//       label: 'Hours This Month',
//       value: monthlySummary?.worked_hours || '0h 0m',
//       sub: `Target: ${monthlySummary?.required_hours || 0}h`,
//       color: '#E8590C',
//       bg: '#FFF3E8',
//       icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
//     },
//     {
//       label: 'Present Days',
//       value: monthlySummary?.present_days || 0,
//       sub: `${monthlySummary?.absent_days || 0} absent`,
//       color: '#16a34a',
//       bg: '#f0fdf4',
//       icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
//     },
//     {
//       label: 'Leaves Taken',
//       value: monthlySummary?.leave_days || 0,
//       sub: pendingLeaves > 0 ? `${pendingLeaves} pending` : 'no pending',
//       color: '#d97706',
//       bg: '#fffbeb',
//       icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
//     },
//   ];

//   // 🆕 UPDATED - Added 'late' and 'half-day' colors
//   const statusColors = {
//     'present':         { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Present' },
//     'in-progress':     { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Working' },
//     'late':            { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Late' },
//     'half-day':        { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Half Day' },
//     'absent':          { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Absent' },
//     'leave':           { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Leave' },
//     'half-day-leave':  { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400', label: 'Half Day Leave' },
//     'holiday':         { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Holiday' },
//     'weekend':         { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Weekend' },
//     'future':          { bg: 'bg-white', text: 'text-gray-300', dot: '', label: '' },
//   };

//   const buildCalendarGrid = () => {
//     if (!calendar?.days || calendar.days.length === 0) return [];
//     const firstDay = new Date(year, month - 1, 1).getDay();
//     const emptyCells = Array(firstDay).fill(null);
//     return [...emptyCells, ...calendar.days];
//   };

//   const grid = buildCalendarGrid();
//   const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
//   const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

//   return (
//     <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
//       <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
//       <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />
//       <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
//         style={{ backgroundImage: 'radial-gradient(#1A1A2E 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

//       <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">

//         {/* WELCOME HEADER */}
//         <div className="mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1A1A2E] to-[#2A2A4E] shadow-[0_20px_70px_-10px_rgba(26,26,46,0.20)]">
//           <div className="relative px-6 py-6 sm:px-8 sm:py-7">
//             <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#E8590C]/15 blur-3xl" />
//             <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#F4A261]/10 blur-2xl" />

//             <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
//               <div className="flex items-center gap-4">
//                 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] text-xl font-bold text-white shadow-lg shadow-orange-600/30">
//                   {user?.name?.charAt(0).toUpperCase()}
//                 </div>
//                 <div>
//                   <p className="text-sm text-white/60">{greeting()},</p>
//                   <h1 className="text-2xl font-extrabold tracking-tight text-white">{user?.name}</h1>
//                   <p className="mt-0.5 text-xs text-white/50">
//                     {user?.emp_code} • {user?.designation || 'Employee'} • {user?.company?.name || ''}
//                   </p>
//                 </div>
//               </div>

//               <div className="text-right">
//                 <p className="text-2xl font-extrabold text-white tabular-nums">{currentTime}</p>
//                 <p className="mt-1 text-xs text-white/60">
//                   {new Date().toLocaleDateString('en-IN', {
//                     weekday: 'long',
//                     day: 'numeric',
//                     month: 'long',
//                     year: 'numeric',
//                     timeZone: 'Asia/Kolkata',
//                   })}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* TODAY'S STATUS */}
//         <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
//           <div className="border-b border-gray-100 px-6 py-4">
//             <div className="flex items-center gap-3">
//               <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E8]">
//                 <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <h3 className="text-sm font-bold text-[#1A1A2E]">Today's Attendance</h3>
//                 <p className="text-xs text-[#9CA3AF]">{todayStatus?.date}</p>
//               </div>
//             </div>
//           </div>

//           <div className="p-6">
//             {(!todayStatus || todayStatus.status === 'not-started') && (
//               <div className="text-center py-4">
//                 <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
//                   <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </div>
//                 <p className="text-sm font-semibold text-[#1A1A2E]">Not Marked Yet</p>
//                 <p className="mt-1 text-xs text-[#9CA3AF]">Please mark your attendance</p>
//                 <Link to="/attendance"
//                   className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">
//                   Mark Attendance
//                 </Link>
//               </div>
//             )}

//             {todayStatus?.status === 'in-progress' && (
//               <div>
//                 <div className="mb-4 flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="relative">
//                       <div className="absolute h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
//                       <div className="h-3 w-3 rounded-full bg-emerald-500" />
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-emerald-700">Currently Working</p>
//                       <p className="text-xs text-[#9CA3AF]">Checked in at {todayStatus.in_time}</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-2xl font-extrabold text-emerald-700 tabular-nums">{liveWorkingTime}</p>
//                     <p className="text-[10px] text-[#9CA3AF]">Live timer</p>
//                   </div>
//                 </div>

//                 <Link to="/attendance"
//                   className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">
//                   Check Out Now
//                 </Link>
//               </div>
//             )}

//             {todayStatus?.status === 'complete' && (
//               <div>
//                 <div className="mb-4 flex items-center gap-3">
//                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
//                     <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
//                     </svg>
//                   </div>
//                   <div>
//                     <p className="text-sm font-bold text-emerald-700">All Done for Today!</p>
//                     <p className="text-xs text-[#9CA3AF]">Great work today 🎉</p>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-3 gap-3">
//                   <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
//                     <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">IN</p>
//                     <p className="mt-1 text-sm font-extrabold text-emerald-700">{todayStatus.in_time}</p>
//                   </div>
//                   <div className="rounded-xl border border-orange-100 bg-[#FFF3E8] p-3 text-center">
//                     <p className="text-[10px] font-bold uppercase tracking-widest text-[#E8590C]">OUT</p>
//                     <p className="mt-1 text-sm font-extrabold text-[#E8590C]">{todayStatus.out_time}</p>
//                   </div>
//                   <div className="rounded-xl bg-[#1A1A2E] p-3 text-center">
//                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">TOTAL</p>
//                     <p className="mt-1 text-sm font-extrabold text-white">{todayStatus.working_hours}</p>
//                   </div>
//                 </div>

//                 {todayStatus.in_site && (
//                   <p className="mt-3 text-center text-xs text-[#9CA3AF]">
//                     📍 {todayStatus.in_site}
//                   </p>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* STAT CARDS */}
//         <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
//           {statCards.map((card) => (
//             <div key={card.label} className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
//               <div className="h-1 w-full" style={{ background: card.color }} />
//               <div className="p-4">
//                 <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: card.bg, color: card.color }}>
//                   <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
//                   </svg>
//                 </div>
//                 <p className="text-2xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
//                 <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">{card.label}</p>
//                 <p className="mt-0.5 text-[10px] text-[#C0C0C0]">{card.sub}</p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* LEAVE BANK */}
//         {myBalance && (
//           <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
//             <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-500" />
//             <div className="p-6">
//               <div className="mb-5 flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
//                     <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
//                     </svg>
//                   </div>
//                   <div>
//                     <h3 className="text-base font-bold text-[#1A1A2E]">Leave Bank</h3>
//                     <p className="text-xs text-[#9CA3AF]">Your free leaves balance</p>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Available</p>
//                   <p className="text-3xl font-extrabold text-blue-600">{myBalance.current_balance || 0}</p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-3 gap-3 mb-4">
//                 <div className="rounded-xl bg-blue-50/50 p-3 text-center">
//                   <p className="text-[10px] font-bold uppercase text-blue-700">Carried</p>
//                   <p className="mt-1 text-base font-extrabold text-blue-700">
//                     {myBalance.current_month?.opening_balance || 0}
//                   </p>
//                 </div>
//                 <div className="rounded-xl bg-emerald-50/50 p-3 text-center">
//                   <p className="text-[10px] font-bold uppercase text-emerald-700">Credited</p>
//                   <p className="mt-1 text-base font-extrabold text-emerald-700">
//                     +{myBalance.current_month?.credited || 0}
//                   </p>
//                 </div>
//                 <div className="rounded-xl bg-red-50/50 p-3 text-center">
//                   <p className="text-[10px] font-bold uppercase text-red-700">Used</p>
//                   <p className="mt-1 text-base font-extrabold text-red-700">
//                     -{myBalance.current_month?.used || 0}
//                   </p>
//                 </div>
//               </div>

//               <div className="rounded-xl bg-[#faf8f5] p-3 flex justify-between items-center">
//                 <div>
//                   <p className="text-[10px] text-[#9CA3AF]">Lifetime Total</p>
//                   <p className="text-xs font-bold text-[#1A1A2E]">
//                     {myBalance.total_credited} credited · {myBalance.total_used} used
//                   </p>
//                 </div>
//                 <p className="text-[10px] text-[#9CA3AF]">
//                   {myBalance.current_balance > 0
//                     ? `${myBalance.current_balance} leaves saved`
//                     : 'No balance — leaves will be unpaid'}
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* CALENDAR */}
//         <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
//           <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
//             <div className="flex items-center gap-3">
//               <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E8]">
//                 <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
//                 </svg>
//               </div>
//               <div>
//                 <h3 className="text-sm font-bold text-[#1A1A2E]">
//                   {months[month - 1]} {year} Calendar
//                 </h3>
//                 <p className="text-xs text-[#9CA3AF]">Click date for details</p>
//               </div>
//             </div>

//             <div className="flex gap-2">
//               <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
//                 className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]">
//                 {months.map((m, i) => (
//                   <option key={i} value={i + 1}>{m}</option>
//                 ))}
//               </select>
//               <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
//                 className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]">
//                 {years.map((y) => (
//                   <option key={y} value={y}>{y}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="p-4 sm:p-6">
//             <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
//               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
//                 <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
//                   {d}
//                 </div>
//               ))}
//             </div>

//             <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
//               {grid.map((day, idx) => {
//                 if (!day) {
//                   return <div key={`empty-${idx}`} className="aspect-square" />;
//                 }

//                 const sc = statusColors[day.status] || statusColors.future;
//                 const isToday = day.is_today;

//                 return (
//                   <div
//                     key={day.date}
//                     className={`group relative aspect-square rounded-xl border p-1.5 transition-all hover:scale-105 sm:p-2 ${
//                       isToday
//                         ? 'border-[#E8590C] bg-[#FFF3E8] ring-2 ring-[#E8590C] ring-offset-2'
//                         : day.status === 'future'
//                           ? 'border-gray-100 bg-gray-50/50'
//                           : `border-transparent ${sc.bg}`
//                     }`}
//                   >
//                     <div className="flex flex-col h-full">
//                       <div className="flex items-start justify-between">
//                         <span className={`text-xs font-bold sm:text-sm ${
//                           isToday ? 'text-[#E8590C]' : sc.text
//                         }`}>
//                           {day.day}
//                         </span>
//                         {day.status !== 'future' && (
//                           <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
//                         )}
//                       </div>

//                       {day.status !== 'future' && day.status !== 'weekend' && (
//                         <div className="mt-auto">
//                           {day.status === 'holiday' && (
//                             <span className="text-[8px] font-bold text-purple-700 sm:text-[9px]">🎉</span>
//                           )}
//                           {(day.status === 'leave' || day.status === 'half-day-leave') && (
//                             <span className="text-[8px] font-bold sm:text-[9px]" style={{ color: sc.text }}>
//                               {day.status === 'half-day-leave' ? '½ Leave' : 'Leave'}
//                             </span>
//                           )}
//                           {/* 🆕 UPDATED - Late and Half Day bhi hours dikhayenge */}
//                           {(day.status === 'present' || day.status === 'in-progress' || day.status === 'late' || day.status === 'half-day') && day.minutes > 0 && (
//                             <span className="text-[8px] font-bold sm:text-[9px]" style={{ color: sc.text }}>
//                               {day.status === 'late' && '⏰ '}
//                               {day.status === 'half-day' && '½ '}
//                               {Math.floor(day.minutes / 60)}h{day.minutes % 60 > 0 ? `${day.minutes % 60}m` : ''}
//                             </span>
//                           )}
//                           {day.status === 'absent' && (
//                             <span className="text-[8px] font-bold text-red-700 sm:text-[9px]">Absent</span>
//                           )}
//                         </div>
//                       )}
//                     </div>

//                     {day.status !== 'future' && (
//                       <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-lg bg-[#1A1A2E] px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
//                         <p className="font-bold">{day.date}</p>
//                         <p className="text-white/70">{day.day_name}</p>
//                         {day.in_time && <p className="mt-1 text-emerald-300">IN: {day.in_time}</p>}
//                         {day.out_time && <p className="text-orange-300">OUT: {day.out_time}</p>}
//                         {day.hours && day.hours !== '0h 0m' && (
//                           <p className="mt-1 font-bold">{day.hours}</p>
//                         )}
//                         {day.holiday_name && (
//                           <p className="text-purple-300">🎉 {day.holiday_name}</p>
//                         )}
//                         {day.leave_type && (
//                           <p className="text-amber-300 capitalize">📋 {day.leave_type} leave</p>
//                         )}
//                         {/* 🆕 Show late/half-day info in tooltip */}
//                         {day.is_late && (
//                           <p className="text-orange-300">⏰ Late</p>
//                         )}
//                         {day.is_half_day && (
//                           <p className="text-yellow-300">½ Half Day</p>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>

//             {/* 🆕 UPDATED LEGEND - Added Late and Half Day */}
//             <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
//               {[
//                 { key: 'present', label: 'Present' },
//                 { key: 'in-progress', label: 'Working' },
//                 { key: 'late', label: 'Late' },
//                 { key: 'half-day', label: 'Half Day' },
//                 { key: 'absent', label: 'Absent' },
//                 { key: 'leave', label: 'Leave' },
//                 { key: 'holiday', label: 'Holiday' },
//                 { key: 'weekend', label: 'Weekend' },
//               ].map((item) => {
//                 const sc = statusColors[item.key];
//                 return (
//                   <div key={item.key} className="flex items-center gap-1.5">
//                     <span className={`h-2.5 w-2.5 rounded-full ${sc.dot}`} />
//                     <span className="text-[11px] font-medium text-[#4B5563]">{item.label}</span>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* QUICK LINKS */}
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
//           <Link to="/attendance"
//             className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm shadow-gray-200/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
//             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF3E8] text-[#E8590C] transition-transform group-hover:scale-110">
//               <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-sm font-bold text-[#1A1A2E]">Mark Attendance</p>
//               <p className="mt-0.5 text-xs text-[#9CA3AF]">Check in or check out</p>
//             </div>
//           </Link>

//           <Link to="/leave"
//             className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm shadow-gray-200/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
//             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
//               <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-sm font-bold text-[#1A1A2E]">Apply Leave</p>
//               <p className="mt-0.5 text-xs text-[#9CA3AF]">
//                 {pendingLeaves > 0 ? `${pendingLeaves} pending` : 'Request time off'}
//               </p>
//             </div>
//           </Link>

//           <Link to="/my-records"
//             className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm shadow-gray-200/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
//             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-110">
//               <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
//               </svg>
//             </div>
//             <div>
//               <p className="text-sm font-bold text-[#1A1A2E]">View Records</p>
//               <p className="mt-0.5 text-xs text-[#9CA3AF]">All your history</p>
//             </div>
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmployeeDashboard;







import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchTodayStatus,
  fetchMonthlySummary,
  fetchCalendar,
} from '../redux/slices/attendanceSlice';
import { fetchMyLeaves } from '../redux/slices/leaveSlice';
import { fetchMyBalance } from '../redux/slices/leaveBalanceSlice';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { todayStatus, monthlySummary, calendar } = useSelector((s) => s.attendance);
  const { myLeaves } = useSelector((s) => s.leaves);
  const { myBalance } = useSelector((s) => s.leaveBalance);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [currentTime, setCurrentTime] = useState('');
  const [liveWorkingTime, setLiveWorkingTime] = useState('0h 0m');

  // 🔧 FIXED - IST Time Clock
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    dispatch(fetchTodayStatus());
    dispatch(fetchMyLeaves());
    dispatch(fetchMyBalance());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchMonthlySummary({ month, year }));
    dispatch(fetchCalendar({ month, year }));
  }, [dispatch, month, year]);

  // 🔧 FIXED - Live Working Timer with IST
  useEffect(() => {
    if (todayStatus?.status === 'in-progress' && todayStatus?.in_time) {
      const updateTimer = () => {
        const inTime = todayStatus.in_time;

        const nowStr = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        });

        const parseTime = (t) => {
          const [time, period] = t.split(' ');
          let [h, m] = time.split(':').map(Number);
          if (period === 'PM' && h !== 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        };

        let diff = parseTime(nowStr) - parseTime(inTime);

        if (diff < 0) diff = 0;
        if (diff > 24 * 60) diff = 0;

        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        setLiveWorkingTime(`${hours}h ${minutes}m`);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 60000);
      return () => clearInterval(interval);
    }
  }, [todayStatus]);

  // Greeting based on IST time
  const greeting = () => {
    const istHour = parseInt(new Date().toLocaleString('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    }));
    if (istHour < 12) return 'Good Morning';
    if (istHour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const pendingLeaves = (myLeaves || []).filter(l => l.status === 'pending').length;

  const statCards = [
    {
      label: 'Hours This Month',
      value: monthlySummary?.worked_hours || '0h 0m',
      sub: `Target: ${monthlySummary?.required_hours || 0}h`,
      color: '#E8590C',
      bg: '#FFF3E8',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Present Days',
      value: monthlySummary?.present_days || 0,
      sub: `${monthlySummary?.absent_days || 0} absent`,
      color: '#16a34a',
      bg: '#f0fdf4',
      icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Leaves Taken',
      value: monthlySummary?.leave_days || 0,
      sub: pendingLeaves > 0 ? `${pendingLeaves} pending` : 'no pending',
      color: '#d97706',
      bg: '#fffbeb',
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    },
  ];

  // 🆕 UPDATED - All statuses with colors
  const statusColors = {
    'present':         { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Present' },
    'in-progress':     { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Working' },
    'late':            { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Late' },
    'half-day':        { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Half Day' },
    'absent':          { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Absent' },
    'leave':           { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Leave' },
    'half-day-leave':  { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400', label: 'Half Day Leave' },
    'holiday':         { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500', label: 'Holiday' },
    'weekend':         { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400', label: 'Weekend' },
    'future':          { bg: 'bg-white', text: 'text-gray-300', dot: '', label: '' },
  };

  const buildCalendarGrid = () => {
    if (!calendar?.days || calendar.days.length === 0) return [];
    const firstDay = new Date(year, month - 1, 1).getDay();
    const emptyCells = Array(firstDay).fill(null);
    return [...emptyCells, ...calendar.days];
  };

  const grid = buildCalendarGrid();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  // 🆕 Check if site worker
  const isSiteWorker = calendar?.is_site_worker || false;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
      <div className="pointer-events-none fixed -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-[#E8590C]/[0.04] blur-[100px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-[#F4A261]/[0.06] blur-[90px]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{ backgroundImage: 'radial-gradient(#1A1A2E 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">

        {/* WELCOME HEADER */}
        <div className="mb-6 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1A1A2E] to-[#2A2A4E] shadow-[0_20px_70px_-10px_rgba(26,26,46,0.20)]">
          <div className="relative px-6 py-6 sm:px-8 sm:py-7">
            <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#E8590C]/15 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#F4A261]/10 blur-2xl" />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8590C] to-[#D14800] text-xl font-bold text-white shadow-lg shadow-orange-600/30">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-white/60">{greeting()},</p>
                  <h1 className="text-2xl font-extrabold tracking-tight text-white">{user?.name}</h1>
                  <p className="mt-0.5 text-xs text-white/50">
                    {user?.emp_code} • {user?.designation || 'Employee'} • {user?.company?.name || ''}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-extrabold text-white tabular-nums">{currentTime}</p>
                <p className="mt-1 text-xs text-white/60">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Kolkata',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TODAY'S STATUS */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E8]">
                <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#1A1A2E]">Today's Attendance</h3>
                <p className="text-xs text-[#9CA3AF]">{todayStatus?.date}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {(!todayStatus || todayStatus.status === 'not-started') && (
              <div className="text-center py-4">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-[#1A1A2E]">Not Marked Yet</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">Please mark your attendance</p>
                <Link to="/attendance"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  Mark Attendance
                </Link>
              </div>
            )}

            {todayStatus?.status === 'in-progress' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700">Currently Working</p>
                      <p className="text-xs text-[#9CA3AF]">Checked in at {todayStatus.in_time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-emerald-700 tabular-nums">{liveWorkingTime}</p>
                    <p className="text-[10px] text-[#9CA3AF]">Live timer</p>
                  </div>
                </div>

                <Link to="/attendance"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E8590C] to-[#D14800] px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-200/40 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  Check Out Now
                </Link>
              </div>
            )}

            {todayStatus?.status === 'complete' && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-700">All Done for Today!</p>
                    <p className="text-xs text-[#9CA3AF]">Great work today 🎉</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">IN</p>
                    <p className="mt-1 text-sm font-extrabold text-emerald-700">{todayStatus.in_time}</p>
                  </div>
                  <div className="rounded-xl border border-orange-100 bg-[#FFF3E8] p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#E8590C]">OUT</p>
                    <p className="mt-1 text-sm font-extrabold text-[#E8590C]">{todayStatus.out_time}</p>
                  </div>
                  <div className="rounded-xl bg-[#1A1A2E] p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">TOTAL</p>
                    <p className="mt-1 text-sm font-extrabold text-white">{todayStatus.working_hours}</p>
                  </div>
                </div>

                {todayStatus.in_site && (
                  <p className="mt-3 text-center text-xs text-[#9CA3AF]">
                    📍 {todayStatus.in_site}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="h-1 w-full" style={{ background: card.color }} />
              <div className="p-4">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: card.bg, color: card.color }}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
                <p className="text-2xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
                <p className="mt-0.5 text-[11px] font-medium text-[#9CA3AF]">{card.label}</p>
                <p className="mt-0.5 text-[10px] text-[#C0C0C0]">{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* LEAVE BANK */}
        {myBalance && (
          <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-500" />
            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1A1A2E]">Leave Bank</h3>
                    <p className="text-xs text-[#9CA3AF]">Your free leaves balance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Available</p>
                  <p className="text-3xl font-extrabold text-blue-600">{myBalance.current_balance || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-blue-50/50 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-blue-700">Carried</p>
                  <p className="mt-1 text-base font-extrabold text-blue-700">
                    {myBalance.current_month?.opening_balance || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50/50 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">Credited</p>
                  <p className="mt-1 text-base font-extrabold text-emerald-700">
                    +{myBalance.current_month?.credited || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-red-50/50 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-red-700">Used</p>
                  <p className="mt-1 text-base font-extrabold text-red-700">
                    -{myBalance.current_month?.used || 0}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#faf8f5] p-3 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-[#9CA3AF]">Lifetime Total</p>
                  <p className="text-xs font-bold text-[#1A1A2E]">
                    {myBalance.total_credited} credited · {myBalance.total_used} used
                  </p>
                </div>
                <p className="text-[10px] text-[#9CA3AF]">
                  {myBalance.current_balance > 0
                    ? `${myBalance.current_balance} leaves saved`
                    : 'No balance — leaves will be unpaid'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CALENDAR */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm shadow-gray-200/60">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3E8]">
                <svg className="h-5 w-5 text-[#E8590C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1A1A2E]">
                    {months[month - 1]} {year} Calendar
                  </h3>
                  {/* 🆕 Site Worker Badge */}
                  {isSiteWorker && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                      🚧 SITE WORKER
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9CA3AF]">Click date for details</p>
              </div>
            </div>

            <div className="flex gap-2">
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]">
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1A2E] outline-none focus:border-[#E8590C]">
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {grid.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const sc = statusColors[day.status] || statusColors.future;
                const isToday = day.is_today;

                return (
                  <div
                    key={day.date}
                    className={`group relative aspect-square rounded-xl border p-1.5 transition-all hover:scale-105 sm:p-2 ${
                      isToday
                        ? 'border-[#E8590C] bg-[#FFF3E8] ring-2 ring-[#E8590C] ring-offset-2'
                        : day.status === 'future'
                          ? 'border-gray-100 bg-gray-50/50'
                          : `border-transparent ${sc.bg}`
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between">
                        <span className={`text-xs font-bold sm:text-sm ${
                          isToday ? 'text-[#E8590C]' : sc.text
                        }`}>
                          {day.day}
                        </span>
                        {day.status !== 'future' && (
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        )}
                      </div>

                      {/* 🆕 UPDATED - All statuses show hours */}
                      {day.status !== 'future' && (
                        <div className="mt-auto">
                          {/* Holiday */}
                          {day.status === 'holiday' && (
                            <span className="text-[8px] font-bold text-purple-700 sm:text-[9px]">🎉</span>
                          )}
                          
                          {/* Leave */}
                          {(day.status === 'leave' || day.status === 'half-day-leave') && (
                            <span className="text-[8px] font-bold sm:text-[9px]" style={{ color: sc.text }}>
                              {day.status === 'half-day-leave' ? '½ Leave' : 'Leave'}
                            </span>
                          )}
                          
                          {/* 🆕 Weekend with work (Sunday work) */}
                          {day.status === 'weekend' && day.minutes > 0 && (
                            <span className="text-[8px] font-bold sm:text-[9px] text-emerald-600">
                              ☀️ {Math.floor(day.minutes / 60)}h{day.minutes % 60 > 0 ? `${day.minutes % 60}m` : ''}
                            </span>
                          )}
                          
                          {/* Present / Late / Half Day / In Progress */}
                          {(day.status === 'present' || day.status === 'in-progress' || day.status === 'late' || day.status === 'half-day') && day.minutes > 0 && (
                            <span className="text-[8px] font-bold sm:text-[9px]" style={{ color: sc.text }}>
                              {day.status === 'late' && '⏰ '}
                              {day.status === 'half-day' && '½ '}
                              {day.is_sunday_work && '☀️ '}
                              {Math.floor(day.minutes / 60)}h{day.minutes % 60 > 0 ? `${day.minutes % 60}m` : ''}
                            </span>
                          )}
                          
                          {/* Absent */}
                          {day.status === 'absent' && (
                            <span className="text-[8px] font-bold text-red-700 sm:text-[9px]">Absent</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tooltip */}
                    {day.status !== 'future' && (
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-lg bg-[#1A1A2E] px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                        <p className="font-bold">{day.date}</p>
                        <p className="text-white/70">{day.day_name}</p>
                        {day.in_time && <p className="mt-1 text-emerald-300">IN: {day.in_time}</p>}
                        {day.out_time && <p className="text-orange-300">OUT: {day.out_time}</p>}
                        {day.hours && day.hours !== '0h 0m' && (
                          <p className="mt-1 font-bold">{day.hours}</p>
                        )}
                        {day.holiday_name && (
                          <p className="text-purple-300">🎉 {day.holiday_name}</p>
                        )}
                        {day.leave_type && (
                          <p className="text-amber-300 capitalize">📋 {day.leave_type} leave</p>
                        )}
                        {day.is_late && (
                          <p className="text-orange-300">⏰ Late</p>
                        )}
                        {day.is_half_day && (
                          <p className="text-yellow-300">½ Half Day</p>
                        )}
                        {day.is_sunday_work && (
                          <p className="text-emerald-300">☀️ Sunday Work</p>
                        )}
                        {day.in_site && (
                          <p className="text-blue-300">📍 {day.in_site}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 🆕 UPDATED LEGEND */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
              {[
                { key: 'present', label: 'Present' },
                { key: 'in-progress', label: 'Working' },
                { key: 'late', label: 'Late' },
                { key: 'half-day', label: 'Half Day' },
                { key: 'absent', label: 'Absent' },
                { key: 'leave', label: 'Leave' },
                { key: 'holiday', label: 'Holiday' },
                { key: 'weekend', label: 'Weekend' },
              ].map((item) => {
                const sc = statusColors[item.key];
                return (
                  <div key={item.key} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${sc.dot}`} />
                    <span className="text-[11px] font-medium text-[#4B5563]">{item.label}</span>
                  </div>
                );
              })}
              {/* 🆕 Sunday Work Legend */}
              {isSiteWorker && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">☀️</span>
                  <span className="text-[11px] font-medium text-[#4B5563]">Sunday Work</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link to="/attendance"
            className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm shadow-gray-200/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF3E8] text-[#E8590C] transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A1A2E]">Mark Attendance</p>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">Check in or check out</p>
            </div>
          </Link>

          <Link to="/leave"
            className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm shadow-gray-200/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A1A2E]">Apply Leave</p>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">
                {pendingLeaves > 0 ? `${pendingLeaves} pending` : 'Request time off'}
              </p>
            </div>
          </Link>

          <Link to="/my-records"
            className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm shadow-gray-200/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A1A2E]">View Records</p>
              <p className="mt-0.5 text-xs text-[#9CA3AF]">All your history</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;