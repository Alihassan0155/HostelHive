import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = ({ children, role }) => {
  const { currentUser, userData, loading } = useAuth();

  // Show a loader while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If not logged in, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Wait for userData to load if we need to check role
  if (role && !userData) {
    // Still loading user data, show loader
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If role is specified, check user role
  if (role && userData?.role !== role) {
    // Redirect to the correct dashboard based on user's actual role
    if (userData?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (userData?.role === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    } else if (userData?.role === 'worker') {
      return <Navigate to="/dashboard/worker" replace />;
    }
    // Fallback to login if role is unknown
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and authorized
  return children;
};

export default PrivateRoute;
