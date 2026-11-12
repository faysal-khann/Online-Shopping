import React from "react";

function CustomizeProducts() {
  return (
    <>
    <div className="flex flex-col gap-6">
      <h4 className="font-medium">Choose a Color</h4>
      <ul className="flex gap-4">
        <li className="w-8 h-8 rounded-full ring-1 ring-gray-300 relative bg-red-400">
          <div className="absolute w-10 h-10 rounded-full ring-2 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer" />
        </li>
        <li className="w-8 h-8 rounded-full ring-1 ring-gray-300 relative bg-blue-950">
          <div className="absolute w-10 h-[2px] bg-red-500 rotate-45 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-not-allowed" />
        </li>
        <li className="w-8 h-8 rounded-full ring-1 ring-gray-300 relative bg-green-500">
          {/* <div className="absolute w-10 h-10 rounded-full ring-2 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" /> */}
        </li>
      </ul>
    </div>
    <div>
      <h4 className="font-medium">Choose a Size</h4>

      <div className="flex gap-4 mt-4">
        <button className="w-10 h-10 rounded-full ring-1 ring-gray-300 text-sm font-medium hover:bg-gray-100">
          S
        </button>
        <button className="w-10 h-10 rounded-full ring-1 ring-gray-300 text-sm font-medium hover:bg-gray-100">
          M
        </button>
        <button className="w-10 h-10 rounded-full ring-1 ring-gray-300 text-sm font-medium hover:bg-gray-100">
          L
        </button>
        <button className="w-10 h-10 rounded-full ring-1 ring-gray-300 text-sm font-medium hover:bg-gray-100">
          XL
        </button>

      </div>
    </div>

    </>

    
  );
}

export default CustomizeProducts;
