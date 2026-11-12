const PRODUCT_PER_PAGE = 8;
import Image from "next/image";
import Link from "next/link";
const ProductList = () => {
  return (
    <div className="mt-12 flex gap-x-8 gap-y-16 justify-between flex-wrap">
      <Link
        href={"/test"}
        className="w-full flex flex-col gap-4  sm:w-[45%] lg:w-[22%]"
        // key={product._id}
      >
        <div className="relative w-full h-80">
          <Image
            src={
              "https://www.watchmojo.com/uploads/thumbs720/Fi-M-Top10-Things-Spider-Man-Homecoming-Got-Right_Y0V9J0-720p30-2.jpg"
            }
            alt=""
            fill
            sizes="25vw"
            className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity easy duration-500"
          />
          <Image
            src={
              "https://www.thepinnaclelist.com/wp-content/uploads/2025/12/A-Glow-in-the-Cold-The-Essence-of-a-Warm-Winter-Home-960x540.jpg"
            }
            alt=""
            fill
            sizes="25vw"
            className="absolute object-cover rounded-md  transition-opacity easy duration-500"
          />
        </div>

        <div className="flex justify-between">
          <span className="font-medium">product.name</span>
          <span className="font-semibold">$45</span>
        </div>

        <div className="text-sm  text-gray-500">My description</div>

        <button className="rounded-2xl ring-1 ring-lama text-lama w-max py-2 px-4 text-xs hover:bg-lama hover:text-white">
          Add to Cart
        </button>
      </Link>
      <Link
        href={"/"}
        className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]"
        // key={product._id}
      >
        <div className="relative w-full h-80">
          <Image
            src={
              "https://www.watchmojo.com/uploads/thumbs720/Fi-M-Top10-Things-Spider-Man-Homecoming-Got-Right_Y0V9J0-720p30-2.jpg"
            }
            alt=""
            fill
            sizes="25vw"
            className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity easy duration-500"
          />
          <Image
            src={
              "https://www.thepinnaclelist.com/wp-content/uploads/2025/12/A-Glow-in-the-Cold-The-Essence-of-a-Warm-Winter-Home-960x540.jpg"
            }
            alt=""
            fill
            sizes="25vw"
            className="absolute object-cover rounded-md  transition-opacity easy duration-500"
          />
        </div>

        <div className="flex justify-between">
          <span className="font-medium">product.name</span>
          <span className="font-semibold">$45</span>
        </div>

        <div className="text-sm  text-gray-500">My description</div>

        <button className="rounded-2xl ring-1 ring-lama text-lama w-max py-2 px-4 text-xs hover:bg-lama hover:text-white">
          Add to Cart
        </button>
      </Link>
      <Link
        href={"/"}
        className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]"
        // key={product._id}
      >
        <div className="relative w-full h-80">
          <Image
            src={
              "https://www.watchmojo.com/uploads/thumbs720/Fi-M-Top10-Things-Spider-Man-Homecoming-Got-Right_Y0V9J0-720p30-2.jpg"
            }
            alt=""
            fill
            sizes="25vw"
            className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity easy duration-500"
          />
          <Image
            src={
              "https://www.thepinnaclelist.com/wp-content/uploads/2025/12/A-Glow-in-the-Cold-The-Essence-of-a-Warm-Winter-Home-960x540.jpg"
            }
            alt=""
            fill
            sizes="25vw"
            className="absolute object-cover rounded-md  transition-opacity easy duration-500"
          />
        </div>

        <div className="flex justify-between">
          <span className="font-medium">product.name</span>
          <span className="font-semibold">$45</span>
        </div>

        <div className="text-sm  text-gray-500">My description</div>

        <button className="rounded-2xl ring-1 ring-lama text-lama w-max py-2 px-4 text-xs hover:bg-lama hover:text-white">
          Add to Cart
        </button>
      </Link>
      <Link
        href={"/"}
        className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]"
        // key={product._id}
      >
        <div className="relative w-full h-80">
          <Image
            src={
              "https://www.watchmojo.com/uploads/thumbs720/Fi-M-Top10-Things-Spider-Man-Homecoming-Got-Right_Y0V9J0-720p30-2.jpg"
            }
            alt=""
            fill
            sizes="25vw"
            className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity easy duration-500"
          />
          <Image
            src={
              "https://www.thepinnaclelist.com/wp-content/uploads/2025/12/A-Glow-in-the-Cold-The-Essence-of-a-Warm-Winter-Home-960x540.jpg"
            }
            alt=""
            fill
            sizes="25vw"
            className="absolute object-cover rounded-md  transition-opacity easy duration-500"
          />
        </div>

        <div className="flex justify-between">
          <span className="font-medium">product.name</span>
          <span className="font-semibold">$45</span>
        </div>

        <div className="text-sm  text-gray-500">My description</div>

        <button className="rounded-2xl ring-1 ring-lama text-lama w-max py-2 px-4 text-xs hover:bg-lama hover:text-white">
          Add to Cart
        </button>
      </Link>
      <Link
        href={"/"}
        className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]"
        // key={product._id}
      >
        <div className="relative w-full h-80">
          <Image
            src={
              "https://www.watchmojo.com/uploads/thumbs720/Fi-M-Top10-Things-Spider-Man-Homecoming-Got-Right_Y0V9J0-720p30-2.jpg"
            }
            alt=""
            fill
            sizes="25vw"
            className="absolute object-cover rounded-md z-10 hover:opacity-0 transition-opacity easy duration-500"
          />
          <Image
            src={
              "https://www.thepinnaclelist.com/wp-content/uploads/2025/12/A-Glow-in-the-Cold-The-Essence-of-a-Warm-Winter-Home-960x540.jpg"
            }
            alt=""
            fill
            sizes="25vw"
            className="absolute object-cover rounded-md  transition-opacity easy duration-500"
          />
        </div>

        <div className="flex justify-between">
          <span className="font-medium">product.name</span>
          <span className="font-semibold">$45</span>
        </div>

        <div className="text-sm  text-gray-500">My description</div>

        <button className="rounded-2xl ring-1 ring-lama text-lama w-max py-2 px-4 text-xs hover:bg-lama hover:text-white">
          Add to Cart
        </button>
      </Link>
    </div>
  );
};

export default ProductList;
