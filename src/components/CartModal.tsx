"use client";

import Image from "next/image";

const CartModal = () => {
  // TEMPORARY
  const cartItems = true;

  const handleCheckout = async () => {
    // Checkout logic
  };

  return (
    <div className="w-max absolute p-4 rounded-md shadow-[0_3px_10px_rgb(0,0,0,0.2)] bg-white top-12 right-0 flex flex-col gap-6 z-20 text-black">
      {!cartItems ? (
        <div className="">Cart is Empty</div>
      ) : (
        <>
          <h2 className="text-xl q  ">Shoping Cart</h2>
          {/* List */}
          <div className="gap-8 flex flex-col">
            {/* ITEM */}
            <div className="flex  gap-4">
              <Image
                src="https://img.pikbest.com/png-images/20241021/shopping-cart-filled-with-grocery-items-and-bags-for-supermarket-retail_10989054.png!bw700"
                alt=""
                width={72}
                height={72}
                className="object-cover rounded-md"
              />
              <div className="flex flex-col justify-between w-full gap-2">
                {/* TOP */}
                <div>
                  {/* TITLE */}
                  <div className="flex items-center justify-between gap-8">
                    <h2 className="font-semibold"> Product Name</h2>
                    <div className="p-1 bg-gray-50 rounded-md">$19.99</div>
                  </div>
                  {/* Description */}
                  <div className="text-sm text-gray-500">available</div>
                </div>

                {/* BOTTOM */}
                <div className="flex  items-center justify-between text-sm">
                  <span className="text-gray-500">Qry. 2</span>
                  <span className="text-white bg-lama p-1 rounded-lg">
                    Remove
                  </span>
                </div>
              </div>
            </div>

            <div className="flex  gap-4">
              <Image
                src="https://img.pikbest.com/png-images/20241021/shopping-cart-filled-with-grocery-items-and-bags-for-supermarket-retail_10989054.png!bw700"
                alt=""
                width={72}
                height={72}
                className="object-cover rounded-md"
              />
              <div className="flex flex-col justify-between w-full gap-2">
                {/* TOP */}
                <div>
                  {/* TITLE */}
                  <div className="flex items-center justify-between gap-8">
                    <h2 className="font-semibold"> Product Name</h2>
                    <div className="p-1 bg-gray-50 rounded-md">$19.99</div>
                  </div>
                  {/* Description */}
                  <div className="text-sm text-gray-500">available</div>
                </div>

                {/* BOTTOM */}
                <div className="flex  items-center justify-between text-sm">
                  <span className="text-gray-500">Qry. 2</span>
                  <span className="text-white bg-lama p-1 rounded-lg">
                    Remove
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* // BOTTON */}
          <div>
            <div className="flex items-center font-semibold justify-between">
              <span className="">Subtotal</span>
              <span className="">$ 400</span>
            </div>
            {/* Description */}
            <p className="text-sm text-gray-500 mt-2 mb-4 mb">
              this is the best product in the world
            </p>

            <div className="flex justify-between">
              <button className="p-2 rounded-md ring-1 ring-gray-300 text-sm">
                View Cart
              </button>
              <button className="p-1 rounded-md bg-blue-400 text-white text-sm">
                Check Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartModal;
