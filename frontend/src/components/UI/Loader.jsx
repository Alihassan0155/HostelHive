import React from "react";

const Loader = ({ size = 35 }) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className="animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        style={{ width: size, height: size }}
      />
    </div>
  );
};

export { Loader };
export default Loader;
