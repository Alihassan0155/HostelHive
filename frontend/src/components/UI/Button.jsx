import React from "react";

const Button = ({ children, className = "", disabled, ...props }) => {
  return (
    <button
      disabled={disabled}
      {...props}
      className={`px-4 py-2 rounded-lg font-semibold transition-all 
      ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}
      bg-blue-600 text-white shadow-md active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
