import { notFound } from "next/navigation";
import ProductImages from "@/components/ProductImages";
import ProductPurchase from "@/components/ProductPurchase";
import TrackView from "@/components/TrackView";
import WishlistButton from "@/components/WishlistButton";
import ProductReviews from "@/components/ProductReviews";
import { finalPrice, getProduct ,money} from "@/lib/api";

const SinglePage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return notFound();

  return (
    <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 relative flex flex-col lg:flex-row gap-16">
      <TrackView
        slug={product.slug}
        name={product.name}
        image={product.images[0]}
        price={finalPrice(product)}
      />

      {/* IMG */}
      <div className="w-full lg:w-1/2 lg:sticky top-20 h-max">
        <ProductImages images={product.images} name={product.name} />
      </div>

      {/* TEXTS */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <h1 className="text-4xl font-medium">{product.name}</h1>
        <p className="text-gray-500">{product.description}</p>
        <div className="h-[2px] bg-gray-100" />

        {product.discountPrice != null ? (
          <div className="flex items-center gap-4">
            <h3 className="text-xl text-gray-500 line-through">{money(product.price)}</h3>
            <h2 className="font-medium text-2xl">৳{finalPrice(product)}</h2>
          </div>
        ) : (
          <h2 className="font-medium text-2xl">{money(product.price)}</h2>
        )}

        <div className="h-[2px] bg-gray-100" />

        <ProductPurchase product={product} />
        <WishlistButton productId={product._id} />

        <div className="h-[2px] bg-gray-100" />
        {product.additionalInfo.map((info) => (
          <div className="text-sm" key={info.title}>
            <h4 className="font-medium mb-4">{info.title}</h4>
            <p>{info.text}</p>
          </div>
        ))}

        <div className="h-[2px] bg-gray-100" />
        <ProductReviews productId={product._id} />
      </div>
    </div>
  );
};

export default SinglePage;