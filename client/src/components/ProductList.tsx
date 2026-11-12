import Image from "next/image";
import Link from "next/link";
import { finalPrice, getProducts, PLACEHOLDER_IMG } from "../lib/api";

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
  limit?: number;
  paginate?: boolean;
};

const ProductList = async ({
  searchParams = {},
  limit = 8,
  paginate = false,
}: Props) => {
  const { products, pages, page } = await getProducts(searchParams, limit);

  const pageHref = (n: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (typeof v === "string" && v && k !== "page") qs.set(k, v);
    }
    qs.set("page", String(n));
    return `/list?${qs.toString()}`;
  };

  if (products.length === 0) {
    return <div className="mt-12 text-gray-500">No products found.</div>;
  }

  return (
    <>
      <div className="mt-12 flex gap-x-8 gap-y-16 justify-between flex-wrap">
        {products.map((product) => (
          <Link
            href={"/" + product.slug}
            className="w-full flex flex-col gap-4 sm:w-[45%] lg:w-[22%]"
            key={product._id}
          >
            <div className="relative w-full h-80 group">
              {/* First Image */}
              <Image
                src={product.images[0] || PLACEHOLDER_IMG}
                alt={product.name}
                fill
                sizes="25vw"
                className="absolute object-cover rounded-md z-10 opacity-100 group-hover:opacity-0 transition-opacity duration-500"
              />

              {/* Second Image */}
              <Image
                src={product.images[1] || product.images[0] || PLACEHOLDER_IMG}
                alt={product.name}
                fill
                sizes="25vw"
                className="absolute object-cover rounded-md z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            </div>

            <div className="flex justify-between">
              <span className="font-medium">{product.name}</span>
              <span className="font-semibold">
                ${finalPrice(product)}
                {product.discountPrice != null && (
                  <span className="ml-2 text-xs text-gray-400 line-through">
                    ${product.price}
                  </span>
                )}
              </span>
            </div>

            <div className="text-sm text-gray-500 line-clamp-2">
              {product.description}
            </div>

            <span className="rounded-2xl ring-1 ring-lama text-lama w-max py-2 px-4 text-xs hover:bg-lama hover:text-white">
              View Product
            </span>
          </Link>
        ))}
      </div>

      {paginate && pages > 1 && (
        <div className="mt-12 flex justify-center items-center gap-4 text-sm">
          {page > 1 && (
            <Link
              href={pageHref(page - 1)}
              className="rounded-md bg-lama text-white py-2 px-4"
            >
              Previous
            </Link>
          )}
          <span className="text-gray-500">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link
              href={pageHref(page + 1)}
              className="rounded-md bg-lama text-white py-2 px-4"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </>
  );
};

export default ProductList;
