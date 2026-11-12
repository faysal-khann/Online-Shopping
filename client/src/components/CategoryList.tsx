import Image from "next/image";
import Link from "next/link";
import { getCategories, PLACEHOLDER_IMG } from "../lib/api";

const CategoryList = async () => {
  const categories = await getCategories();

  return (
    <div className="px-4 overflow-x-scroll scrollbar-hide mt-12">
      <div className="flex gap-4 md:gap-8">
        {categories.map((cat) => (
          <Link
            href={`/list?cat=${cat.slug}`}
            className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 xl:w-1/6"
            key={cat._id}
          >
            <div className="relative bg-slate-100 w-full h-96">
              <Image
                src={cat.image || PLACEHOLDER_IMG}
                alt={cat.name}
                fill
                sizes="20vw"
                className="object-cover"
              />
            </div>
            <h1 className="mt-8 font-light text-xl tracking-wide">{cat.name}</h1>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;