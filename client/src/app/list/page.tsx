import Image from "next/image";
import { Suspense } from "react";
import ProductList from "../../components/ProductList";
import Filter from "../../components/Filter";
import { getCategories } from "../../lib/api";

const ListPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const sp = await searchParams;
  const categories = await getCategories();

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative">
      {/* CAMPAIGN */}
      <div className="hidden bg-pink-50 px-4 sm:flex justify-between h-64">
        <div className="w-2/3 flex flex-col items-center justify-center gap-8">
          <h1 className="text-4xl font-semibold leading-[48px] text-gray-700">
            Grab up to 50% off on
            <br /> Selected Products
          </h1>
        </div>
        <div className="relative w-1/3">
          <Image src="/woman.png" alt="" fill className="object-contain" />
        </div>
      </div>

      {/* FILTER */}
      <Suspense fallback={null}>
        <Filter categories={categories} />
      </Suspense>

      {/* PRODUCTS */}
      <h1 className="mt-12 text-xl font-semibold">
        {sp.deals === "1" ? "Deals: discounted products" : "For You!"}
      </h1>
      <ProductList searchParams={sp} paginate />
    </div>
  );
};

export default ListPage;
