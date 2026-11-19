import Link from "next/link";

const AboutPage = () => (
  <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 pb-16 max-w-4xl">
    <h1 className="text-3xl font-semibold mb-4">About Cartiva</h1>
    <p className="text-gray-600 leading-relaxed mb-4">
      Cartiva is an online store built to make shopping simple: clear prices, fast checkout and
      easy order tracking. Browse by category, save products to your wishlist and follow your
      order from payment to delivery.
    </p>
    <div className="grid sm:grid-cols-3 gap-4 my-8">
      {[
        ["Fair pricing", "Free standard shipping on orders over $100."],
        ["Easy returns", "Return delivered items within 14 days."],
        ["Secure checkout", "Card details are never stored."],
      ].map(([t, d]) => (
        <div key={t} className="ring-1 ring-gray-200 rounded-xl p-5">
          <div className="font-medium mb-1">{t}</div>
          <div className="text-sm text-gray-500">{d}</div>
        </div>
      ))}
    </div>
    <Link href="/list" className="rounded-lg bg-lama text-white text-sm px-5 py-2 inline-block">
      Start shopping
    </Link>
  </div>
);

export default AboutPage;