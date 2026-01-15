import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiLogOut, FiArrowLeft } from "react-icons/fi";
import NotificationBell from "./NotificationBell";

const Header = ({ title, showBackButton = true, backTo = null }) => {
  const { logout, userData } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    // If backTo is specified, navigate there directly
    if (backTo) {
      navigate(backTo);
      return;
    }
    
    // Otherwise, check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to dashboard based on user role
      if (userData?.role === 'student') {
        navigate('/student/dashboard');
      } else if (userData?.role === 'worker') {
        navigate('/dashboard/worker');
      } else if (userData?.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/login');
      }
    }
  };

  return (
    <div className="flex justify-between items-center bg-white dark:bg-gray-900 shadow p-4 mb-4 rounded-xl">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center justify-center"
            aria-label="Go back"
          >
            <FiArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-semibold">{userData?.firstName}</span>

        {/* Notification Bell - only show for authenticated users */}
        {userData && <NotificationBell />}

        <button
          onClick={logout}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
        >
          <FiLogOut />
          Logout
        </button>
      </div>
    </div>
  );
};

export { Header };
export default Header;
