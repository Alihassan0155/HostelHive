import React from "react";

const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-900 shadow-md rounded-xl p-4 
      border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {children}
    </div>
  );
};

export { Card };
export default Card;
