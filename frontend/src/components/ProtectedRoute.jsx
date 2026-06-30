// import { useSelector } from 'react-redux';
// import { Navigate } from 'react-router-dom';

// const ProtectedRoute = ({ children }) => {
//   const { user, token } = useSelector((state) => state.auth);

//   if (!token || !user) {
//     return <Navigate to="/login" replace />;
//   }

//   // 🆕 Block admin/super_admin from employee routes
//   if (user.role === 'super_admin') {
//     return <Navigate to="/super-admin/dashboard" replace />;
//   }
//   if (user.role === 'admin') {
//     return <Navigate to="/admin/dashboard" replace />;
//   }

//   // Employee or Manager can access employee routes
//   return children;
// };

// export default ProtectedRoute;



import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

  // 🔍 Debug
  console.log('🛡️ ProtectedRoute check:', {
    hasToken: !!token,
    hasUser: !!user,
    role: user?.role,
    face_registered: user?.face_registered,
  });

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Admin redirect
  if (user.role === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // ✅ Face not registered
  if (!user.face_registered) {
    return <Navigate to="/face-register" replace />;
  }

  return children;
};

export default ProtectedRoute;