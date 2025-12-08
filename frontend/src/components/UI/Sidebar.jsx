import { NavLink } from "react-router-dom";
import { FiHome, FiPlusCircle, FiList, FiUser } from "react-icons/fi";

const Sidebar = () => {
  const links = [
    { to: "/student/dashboard", label: "Dashboard", icon: <FiHome /> },
    { to: "/student/report", label: "Report Issue", icon: <FiPlusCircle /> },
    { to: "/student/issues", label: "My Issues", icon: <FiList /> },
    { to: "/student/profile", label: "Profile", icon: <FiUser /> },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen p-5">
      <h2 className="text-2xl font-bold mb-8 text-blue-600">HostelHelp</h2>

      <div className="flex flex-col gap-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-all font-medium 
              ${isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
