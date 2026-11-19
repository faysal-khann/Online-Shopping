import ProductList from "@/components/ProductList";
import Slider from "../components/Slider";
import CategoryList from "@/components/CategoryList";
import BannerSlider from "@/components/BannerSlider";
import { getBanners } from "@/lib/api";

const HomePage = async () => {
  const banners = await getBanners();
  return (
    <div>
       {banners.length > 0 ? <BannerSlider banners={banners} /> : <Slider />}
      
      <div className="mt-24 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
        <h1 className="text-2xl">Featured Products</h1>
        <ProductList limit={4} />
      </div>
      <div className="mt-24">
        <h1 className="text-2xl px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">Categories</h1>
        <CategoryList />
      </div>
      <div className="mt-24 px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64">
        <h1 className="text-2xl">New Products</h1>
        <ProductList limit={4} searchParams={{ sort: "desc lastUpdated" }} />
      </div>
    </div>
  );
};

export default HomePage;