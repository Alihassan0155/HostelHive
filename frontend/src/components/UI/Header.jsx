import React from "react";
import { useAuth } from "../../context/AuthContext";
import { FiLogOut } from "react-icons/fi";

const Header = ({ title }) => {
  const { logout, userData } = useAuth();

  return (
    <div className="flex justify-between items-center bg-white dark:bg-gray-900 shadow p-4 mb-4 rounded-xl">
      <h1 className="text-xl font-bold">{title}</h1>

      <div className="flex items-center gap-4">
        <span className="font-semibold">{userData?.firstName}</span>

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
