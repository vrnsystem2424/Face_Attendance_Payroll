import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const SuperAdminRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/super-admin/login" replace />;
  }

  if (user.role !== 'super_admin') {
    // Redirect based on user role
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/attendance" replace />;
  }

  return children;
};

export default SuperAdminRoute;