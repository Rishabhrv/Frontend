import Link from "next/link";

const CreateAccountSection = () => {
  return (
    <section className="mt-20 bg-[#f8f8f8]">
      <div className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        
        {/* LEFT CONTENT */}
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-semibold mb-4">
            Join AGPH Store Today
          </h2>

          <p className="text-gray-700 mb-6 leading-relaxed">
            Create your free AGPH account to explore exclusive books, manage your
            orders, access special discounts, and stay updated with new releases
            from India’s leading self-publishing platform.
          </p>

          <ul className="space-y-3 text-gray-700 mb-8">
            <li>✔ Save your favourite books</li>
            <li>✔ Faster checkout & order tracking</li>
            <li>✔ Access exclusive author content</li>
            <li>✔ Get notified about new releases</li>
          </ul>

          {/* CTA BUTTONS */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 transition"
            >
              Create Free Account
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded border border-black px-6 py-3 font-medium hover:bg-black hover:text-white transition"
            >
              Already a Member? Sign In
            </Link>
          </div>
        </div>

        {/* RIGHT VISUAL */}
        <div className="grid grid-cols-2 gap-6">
          
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h4 className="text-lg font-semibold mb-2">Personal Library</h4>
            <p className="text-sm text-gray-600">
              Access all your purchased eBooks and physical orders anytime from one place.
            </p>
          </div>
        
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h4 className="text-lg font-semibold mb-2">Wishlist & Favourites</h4>
            <p className="text-sm text-gray-600">
              Save books you love and buy them later with a single click.
            </p>
          </div>
        
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h4 className="text-lg font-semibold mb-2">Exclusive Offers</h4>
            <p className="text-sm text-gray-600">
              Get special discounts and early access to new releases.
            </p>
          </div>
        
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h4 className="text-lg font-semibold mb-2">Author Updates</h4>
            <p className="text-sm text-gray-600">
              Follow your favourite authors and never miss their latest books.
            </p>
          </div>
        
        </div>


      </div>
    </section>
  );
};

export default CreateAccountSection;
