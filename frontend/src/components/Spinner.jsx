import React from "react";

const Spinner = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="w-10 h-10 border-8 border-gray-200 border-t-8 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );
};

export default Spinner;
