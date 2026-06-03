import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ManagerRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Manager + Admin + Super Admin can access
  const allowedRoles = ['manager', 'admin', 'super_admin'];

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/attendance" replace />;
  }

  return children;
};

export default ManagerRoute;