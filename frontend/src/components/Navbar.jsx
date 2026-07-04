
// // src/components/Navbar.jsx

// import { useState, useRef, useEffect } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { logout } from '../redux/slices/authSlice';

// const Navbar = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user } = useSelector((state) => state.auth);

//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [profileOpen, setProfileOpen] = useState(false);
//   const profileRef = useRef(null);

//   useEffect(() => {
//     const handleClick = (e) => {
//       if (profileRef.current && !profileRef.current.contains(e.target)) {
//         setProfileOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClick);
//     return () => document.removeEventListener('mousedown', handleClick);
//   }, []);

//   useEffect(() => {
//     setMobileOpen(false);
//     setProfileOpen(false);
//   }, [location.pathname]);

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate('/login');
//   };

//   const isActive = (path) => location.pathname === path;

//   // ═══════════════════════════════════════════════
//   // EMPLOYEE LINKS
//   // ═══════════════════════════════════════════════
//   const employeeLinks = [
//     {
//       to: '/dashboard',
//       label: 'Dashboard',
//       icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z',
//     },
//     {
//       to: '/attendance',
//       label: 'Attendance',
//       icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25',
//     },
//     {
//       to: '/leave',
//       label: 'Leave',
//       icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25',
//     },
//     {
//       to: '/my-records',
//       label: 'Records',
//       icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5',
//     },
//   ];

//   // ═══════════════════════════════════════════════
//   // MANAGER LINKS
//   // ═══════════════════════════════════════════════
//   const managerLinks = [
//     {
//       to: '/manager/dashboard',
//       label: 'Dashboard',
//       icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25',
//     },
//     {
//       to: '/manager/leaves',
//       label: 'Pending Leaves',
//       icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5',
//     },
//   ];

//   // ═══════════════════════════════════════════════
//   // ADMIN LINKS (Full Access)
//   // ═══════════════════════════════════════════════
//   const adminLinks = [
//     {
//       to: '/admin/dashboard',
//       label: 'Dashboard',
//       icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25',
//     },
//     {
//       to: '/admin/employees',
//       label: 'Employees',
//       icon: 'M15 19.128a9.38 9.38 0 002.625.372',
//     },
//     {
//       to: '/admin/attendance',
//       label: 'Attendance',
//       icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
//     },
//     {
//       to: '/admin/leaves',
//       label: 'Leaves',
//       icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5',
//     },
//     {
//       to: '/admin/master-data',
//       label: 'Master Data',
//       icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125',
//     },
//     {
//       to: '/admin/reception',
//       label: 'Reception',
//       icon: 'M6.827 6.175A2.31 2.31 0 015.186 7.23',
//       highlight: true,
//     },
//   ];

//   // ═══════════════════════════════════════════════
//   // 🆕 MANAGER ADMIN LINKS (LIMITED - Only Leaves)
//   // ═══════════════════════════════════════════════
//   const managerAdminLinks = [
//     {
//       to: '/admin/leaves',
//       label: 'Pending Leaves',
//       icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5',
//     },
//   ];

//   // ═══════════════════════════════════════════════
//   // SUPER ADMIN LINKS
//   // ═══════════════════════════════════════════════
//   const superAdminLinks = [
//     {
//       to: '/super-admin/dashboard',
//       label: 'Dashboard',
//       icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25',
//     },
//     {
//       to: '/super-admin/companies',
//       label: 'Companies',
//       icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18',
//     },
//     {
//       to: '/super-admin/admins',
//       label: 'Admins',
//       icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75',
//     },
//     {
//       to: '/super-admin/employees',
//       label: 'Employees',
//       icon: 'M15 19.128a9.38 9.38 0 002.625.372',
//     },
//     {
//       to: '/super-admin/attendance',
//       label: 'Attendance',
//       icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
//     },
//     {
//       to: '/super-admin/sites',
//       label: 'Sites',
//       icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z',
//     },
//     {
//       to: '/super-admin/leaves',
//       label: 'Leaves',
//       icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5',
//     },
//     {
//       to: '/super-admin/monthly-settings',
//       label: 'Monthly',
//       icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5',
//     },
//     {
//       to: '/super-admin/payroll',
//       label: 'Payroll',
//       icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101',
//       highlight: true,
//     },
//   ];

//   // ═══════════════════════════════════════════════
//   // 🎯 PICK LINKS BASED ON ROLE + ASSIGNED_MANAGER
//   // ═══════════════════════════════════════════════
//   let links = [];
//   if (user?.role === 'super_admin') {
//     links = superAdminLinks;
//   } else if (user?.role === 'admin') {
//     // 🆕 CHECK: If admin has assigned_manager → Limited access
//     if (user?.assigned_manager && user.assigned_manager.trim() !== '') {
//       links = managerAdminLinks;  // ⭐ Only "Pending Leaves"
//     } else {
//       links = adminLinks;  // Full admin access
//     }
//   } else if (user?.role === 'manager') {
//     links = managerLinks;
//   } else {
//     links = employeeLinks;
//   }

//   // ═══════════════════════════════════════════════
//   // ROLE BADGE COLORS
//   // ═══════════════════════════════════════════════
//   const getRoleBadge = (role) => {
//     switch (role) {
//       case 'super_admin':
//         return { label: 'Super Admin', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' };
//       case 'admin':
//         // 🆕 Check if manager-specific admin
//         if (user?.assigned_manager && user.assigned_manager.trim() !== '') {
//           return { label: 'Leave Admin', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
//         }
//         return { label: 'Admin', bg: 'bg-[#FFF3E8]', text: 'text-[#E8590C]', dot: 'bg-[#E8590C]' };
//       case 'manager':
//         return { label: 'Manager', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
//       default:
//         return { label: 'Employee', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
//     }
//   };

//   const roleBadge = getRoleBadge(user?.role);

//   if (!user) return null;

//   return (
//     <>
//       <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl">
//         <div className="mx-auto max-w-7xl px-4 sm:px-6">
//           <div className="flex h-16 items-center justify-between">

//             {/* Logo */}
//             <Link to="/" className="flex items-center gap-3 group">
//               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40 transition-transform duration-300 group-hover:scale-105">
//                 <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
//                 </svg>
//               </div>
//               <div className="hidden sm:block">
//                 <h1 className="text-base font-bold text-[#1A1A2E] leading-tight">Employees</h1>
//                 <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Management System</p>
//               </div>
//             </Link>

//             {/* Desktop Nav Links */}
//             <div className="hidden lg:flex items-center gap-1">
//               {links.map((link) => (
//                 <Link
//                   key={link.to}
//                   to={link.to}
//                   className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
//                     isActive(link.to)
//                       ? 'bg-[#FFF3E8] text-[#E8590C]'
//                       : link.highlight
//                       ? 'bg-[#E8590C] text-white hover:bg-[#D14800] shadow-md shadow-orange-200/30'
//                       : 'text-[#4B5563] hover:bg-gray-100 hover:text-[#1A1A2E]'
//                   }`}
//                 >
//                   {link.label}
//                   {isActive(link.to) && (
//                     <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[18px] h-[2px] w-6 rounded-full bg-[#E8590C]"></span>
//                   )}
//                 </Link>
//               ))}
//             </div>

//             {/* Right Section */}
//             <div className="flex items-center gap-3">
//               {/* Profile Dropdown */}
//               <div className="relative" ref={profileRef}>
//                 <button
//                   onClick={() => setProfileOpen(!profileOpen)}
//                   className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2 transition-all duration-200 hover:border-[#E8590C]/30 hover:shadow-md"
//                 >
//                   <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8590C] to-[#F4A261] text-white text-sm font-bold shadow-sm">
//                     {user.name?.charAt(0).toUpperCase()}
//                   </div>
//                   <div className="hidden sm:block text-left">
//                     <p className="text-sm font-semibold text-[#1A1A2E] leading-tight">{user.name}</p>
//                     <p className="text-[10px] text-[#9CA3AF] capitalize">{roleBadge.label}</p>
//                   </div>
//                   <svg className={`h-4 w-4 text-[#9CA3AF] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
//                   </svg>
//                 </button>

//                 {/* Dropdown */}
//                 {profileOpen && (
//                   <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 animate-dropdown">
//                     <div className="border-b border-gray-100 bg-gradient-to-r from-[#FFF8F3] to-[#FFF3E8] p-4">
//                       <div className="flex items-center gap-3">
//                         <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#F4A261] text-white font-bold text-lg shadow-md shadow-orange-200/40">
//                           {user.name?.charAt(0).toUpperCase()}
//                         </div>
//                         <div>
//                           <p className="font-semibold text-[#1A1A2E] text-sm">{user.name}</p>
//                           <p className="text-xs text-[#6B7280]">{user.email}</p>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="p-2">
//                       <div className="mb-1 px-3 py-1.5">
//                         <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${roleBadge.bg} ${roleBadge.text}`}>
//                           <span className={`h-1.5 w-1.5 rounded-full ${roleBadge.dot}`}></span>
//                           {roleBadge.label}
//                         </span>
//                       </div>

//                       {/* 🆕 Show assigned manager if applicable */}
//                       {user?.assigned_manager && (
//                         <div className="mb-1 px-3 py-1.5">
//                           <p className="text-[10px] text-gray-500 uppercase tracking-wider">Managing Team</p>
//                           <p className="text-sm font-semibold text-amber-700">👥 {user.assigned_manager}</p>
//                         </div>
//                       )}

//                       {user.role !== 'super_admin' && user.company_id?.name && (
//                         <div className="mb-1 px-3 py-1.5">
//                           <p className="text-[10px] text-gray-500 uppercase tracking-wider">Company</p>
//                           <p className="text-sm font-semibold text-[#1A1A2E]">{user.company_id.name}</p>
//                         </div>
//                       )}

//                       <button
//                         onClick={handleLogout}
//                         className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
//                       >
//                         <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
//                         </svg>
//                         Sign out
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Mobile Menu Button */}
//               <button
//                 onClick={() => setMobileOpen(!mobileOpen)}
//                 className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-[#4B5563] transition-all hover:bg-gray-50"
//               >
//                 {mobileOpen ? (
//                   <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 ) : (
//                   <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
//                   </svg>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Mobile Menu */}
//         {mobileOpen && (
//           <div className="lg:hidden border-t border-gray-100 bg-white p-4 animate-slideDown">
//             <div className="space-y-1">
//               {links.map((link) => (
//                 <Link
//                   key={link.to}
//                   to={link.to}
//                   className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
//                     isActive(link.to)
//                       ? 'bg-[#FFF3E8] text-[#E8590C]'
//                       : link.highlight
//                       ? 'bg-[#E8590C] text-white'
//                       : 'text-[#4B5563] hover:bg-gray-50'
//                   }`}
//                 >
//                   <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
//                   </svg>
//                   {link.label}
//                 </Link>
//               ))}
//             </div>

//             <div className="mt-4 pt-4 border-t border-gray-100">
//               <button
//                 onClick={handleLogout}
//                 className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
//               >
//                 <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
//                 </svg>
//                 Sign out
//               </button>
//             </div>
//           </div>
//         )}
//       </nav>

//       <style>{`
//         @keyframes dropdown {
//           from { opacity: 0; transform: translateY(-8px) scale(0.96); }
//           to { opacity: 1; transform: translateY(0) scale(1); }
//         }
//         .animate-dropdown {
//           animation: dropdown 0.2s ease-out;
//         }
//         @keyframes slideDown {
//           from { opacity: 0; max-height: 0; }
//           to { opacity: 1; max-height: 500px; }
//         }
//         .animate-slideDown {
//           animation: slideDown 0.3s ease-out;
//         }
//       `}</style>
//     </>
//   );
// };

// export default Navbar;






// src/components/Navbar.jsx

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // ═══════════════════════════════════════════════
  // EMPLOYEE LINKS
  // ═══════════════════════════════════════════════
  const employeeLinks = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z',
    },
    {
      to: '/attendance',
      label: 'Attendance',
      icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25',
    },
    {
      to: '/leave',
      label: 'Leave',
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25',
    },
    {
      to: '/my-records',
      label: 'Records',
      icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5',
    },
  ];

  // ═══════════════════════════════════════════════
  // MANAGER LINKS
  // ═══════════════════════════════════════════════
  const managerLinks = [
    {
      to: '/manager/dashboard',
      label: 'Dashboard',
      icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25',
    },
    {
      to: '/manager/leaves',
      label: 'Pending Leaves',
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5',
    },
  ];

  // ═══════════════════════════════════════════════
  // ADMIN LINKS (Full Access)
  // ═══════════════════════════════════════════════
  const adminLinks = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25',
    },
    {
      to: '/admin/employees',
      label: 'Employees',
      icon: 'M15 19.128a9.38 9.38 0 002.625.372',
    },
    {
      to: '/admin/attendance',
      label: 'Attendance',
      icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      to: '/admin/leaves',
      label: 'Leaves',
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5',
    },
    {
      to: '/admin/master-data',
      label: 'Master Data',
      icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125',
    },
    {
      to: '/admin/reception',
      label: 'Reception',
      icon: 'M6.827 6.175A2.31 2.31 0 015.186 7.23',
      highlight: true,
    },
  ];

  // ═══════════════════════════════════════════════
  // 🆕 MANAGER ADMIN LINKS (Only Leaves)
  // ═══════════════════════════════════════════════
  const managerAdminLinks = [
    {
      to: '/admin/leaves',
      label: 'Pending Leaves',
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5',
    },
  ];

  // ═══════════════════════════════════════════════
  // 🆕 FOLLOWUP ADMIN LINKS (Only Dashboard)
  // ═══════════════════════════════════════════════
  const followupAdminLinks = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25',
    },
  ];

  // ═══════════════════════════════════════════════
  // SUPER ADMIN LINKS
  // ═══════════════════════════════════════════════
  const superAdminLinks = [
    {
      to: '/super-admin/dashboard',
      label: 'Dashboard',
      icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25',
    },
    {
      to: '/super-admin/companies',
      label: 'Companies',
      icon: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18',
    },
    {
      to: '/super-admin/admins',
      label: 'Admins',
      icon: 'M17.982 18.725A7.488 7.488 0 0012 15.75',
    },
    {
      to: '/super-admin/employees',
      label: 'Employees',
      icon: 'M15 19.128a9.38 9.38 0 002.625.372',
    },
    {
      to: '/super-admin/attendance',
      label: 'Attendance',
      icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      to: '/super-admin/sites',
      label: 'Sites',
      icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
      to: '/super-admin/leaves',
      label: 'Leaves',
      icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5',
    },
    {
      to: '/super-admin/monthly-settings',
      label: 'Monthly',
      icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5',
    },
    {
      to: '/super-admin/payroll',
      label: 'Payroll',
      icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101',
      highlight: true,
    },
  ];

  // ═══════════════════════════════════════════════
  // 🎯 PICK LINKS BASED ON ROLE + ADMIN TYPE
  // ═══════════════════════════════════════════════
  let links = [];
  if (user?.role === 'super_admin') {
    links = superAdminLinks;
  } else if (user?.role === 'admin') {
    // 🆕 Follow-up admin - ONLY dashboard
    if (user?.admin_type === 'followup') {
      links = followupAdminLinks;
    }
    // Leave admin - ONLY leaves
    else if (user?.assigned_manager && user.assigned_manager.trim() !== '') {
      links = managerAdminLinks;
    }
    // Regular admin - full access
    else {
      links = adminLinks;
    }
  } else if (user?.role === 'manager') {
    links = managerLinks;
  } else {
    links = employeeLinks;
  }

  // ═══════════════════════════════════════════════
  // ROLE BADGE COLORS
  // ═══════════════════════════════════════════════
  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' };
      case 'admin':
        // 🆕 Follow-up admin
        if (user?.admin_type === 'followup') {
          return { label: 'Follow-up', bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' };
        }
        // Leave admin
        if (user?.assigned_manager && user.assigned_manager.trim() !== '') {
          return { label: 'Leave Admin', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
        }
        // Regular admin
        return { label: 'Admin', bg: 'bg-[#FFF3E8]', text: 'text-[#E8590C]', dot: 'bg-[#E8590C]' };
      case 'manager':
        return { label: 'Manager', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
      default:
        return { label: 'Employee', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  if (!user) return null;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#D14800] shadow-md shadow-orange-200/40 transition-transform duration-300 group-hover:scale-105">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-[#1A1A2E] leading-tight">Employees</h1>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Management System</p>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-[#FFF3E8] text-[#E8590C]'
                      : link.highlight
                      ? 'bg-[#E8590C] text-white hover:bg-[#D14800] shadow-md shadow-orange-200/30'
                      : 'text-[#4B5563] hover:bg-gray-100 hover:text-[#1A1A2E]'
                  }`}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[18px] h-[2px] w-6 rounded-full bg-[#E8590C]"></span>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2 transition-all duration-200 hover:border-[#E8590C]/30 hover:shadow-md"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8590C] to-[#F4A261] text-white text-sm font-bold shadow-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-[#1A1A2E] leading-tight">{user.name}</p>
                    <p className="text-[10px] text-[#9CA3AF] capitalize">{roleBadge.label}</p>
                  </div>
                  <svg className={`h-4 w-4 text-[#9CA3AF] transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 animate-dropdown">
                    <div className="border-b border-gray-100 bg-gradient-to-r from-[#FFF8F3] to-[#FFF3E8] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#E8590C] to-[#F4A261] text-white font-bold text-lg shadow-md shadow-orange-200/40">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1A1A2E] text-sm">{user.name}</p>
                          <p className="text-xs text-[#6B7280]">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <div className="mb-1 px-3 py-1.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${roleBadge.bg} ${roleBadge.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${roleBadge.dot}`}></span>
                          {roleBadge.label}
                        </span>
                      </div>

                      {/* 🆕 Show assigned manager if applicable */}
                      {user?.assigned_manager && (
                        <div className="mb-1 px-3 py-1.5">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Managing Team</p>
                          <p className="text-sm font-semibold text-amber-700">👥 {user.assigned_manager}</p>
                        </div>
                      )}

                      {user.role !== 'super_admin' && user.company_id?.name && (
                        <div className="mb-1 px-3 py-1.5">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Company</p>
                          <p className="text-sm font-semibold text-[#1A1A2E]">{user.company_id.name}</p>
                        </div>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-[#4B5563] transition-all hover:bg-gray-50"
              >
                {mobileOpen ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white p-4 animate-slideDown">
            <div className="space-y-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive(link.to)
                      ? 'bg-[#FFF3E8] text-[#E8590C]'
                      : link.highlight
                      ? 'bg-[#E8590C] text-white'
                      : 'text-[#4B5563] hover:bg-gray-50'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @keyframes dropdown {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-dropdown {
          animation: dropdown 0.2s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 500px; }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;