const ContactPage = () => (
  <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-64 pb-16 max-w-3xl">
    <h1 className="text-3xl font-semibold mb-4">Contact us</h1>
    <p className="text-gray-600 mb-8">
      Questions about an order, a return or a product? Reach us any of these ways.
    </p>
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="ring-1 ring-gray-200 rounded-xl p-5">
        <div className="text-xs text-gray-500 mb-1">Email</div>
        <a href="mailto:hello@cartiva.com" className="font-medium hover:underline">
          hello@cartiva.com
        </a>
      </div>
      <div className="ring-1 ring-gray-200 rounded-xl p-5">
        <div className="text-xs text-gray-500 mb-1">Hours</div>
        <div className="font-medium">Sat to Thu, 9am to 6pm</div>
      </div>
    </div>
    <p className="text-sm text-gray-500 mt-8">
      Order problems are fastest to resolve from your dashboard: open the order and choose
      Return items or Cancel order.
    </p>
  </div>
);

export default ContactPage;