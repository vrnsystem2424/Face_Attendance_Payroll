import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  // 🆕 Allow admin and super_admin
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/attendance" replace />;
  }

  return children;
};

export default AdminRoute;