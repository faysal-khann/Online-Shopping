import CustomizeProducts from "../../components/CustomizeProducts";
import ProductImages from "../../components/ProductImages";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Add from "../../components/Add";

const SinglePage = () => {
  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative flex flex-col lg:flex-row gap-16">
      {/* IMG */}
      <div className="w-full lg:w-1/2 lg:sticky top-20 h-max">
        <ProductImages />
      </div>
      {/* TEXTS */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <h1 className="text-4xl font-medium">Product Name</h1>
        <p className="text-gray-500">
          Product Description A product description is marketing copy that
          explains what a product is, highlights its features and benefits, and
          persuades customers to buy it. It typically appears on product pages
          and includes details such as specifications, use cases, and unique
          selling points to help shoppers make informed decisions.
        </p>
        <div className="h-[2px] bg-gray-100" />

        <div className="flex items-center gap-4">
          <h3 className="text-xl text-gray-500 line-through">50.00</h3>
          <h2 className="font-medium text-2xl">60.00</h2>
        </div>

        <div className="h-[2px] bg-gray-100" />

        <CustomizeProducts />

        <Add />

        <div className="h-[2px] bg-gray-100" />
        <div className="text-sm">
          <h4 className="font-medium mb-4"> Title</h4>
          <p>
            {" "}
            Product Description A product description is marketing copy that
            explains what a product is, highlights its features and benefits,
            and persuades customers to buy it. It typically appears on product
            pages and includes details such as specifications, use cases, and
            unique selling points to help shoppers make informed decisions.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-medium mb-4"> Title</h4>
          <p>
            {" "}
            Product Description A product description is marketing copy that
            explains what a product is, highlights its features and benefits,
            and persuades customers to buy it. It typically appears on product
            pages and includes details such as specifications, use cases, and
            unique selling points to help shoppers make informed decisions.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-medium mb-4"> Title</h4>
          <p>
            {" "}
            Product Description A product description is marketing copy that
            explains what a product is, highlights its features and benefits,
            and persuades customers to buy it. It typically appears on product
            pages and includes details such as specifications, use cases, and
            unique selling points to help shoppers make informed decisions.
          </p>
        </div>

        <div className="h-[2px] bg-gray-100" />
        {/* * REVIEWS  */}
        <h1 className="text-2xl">User Reviews</h1>
        <Suspense fallback="Loading..."></Suspense>
      </div>
    </div>
  );
};

export default SinglePage;
