import Link from "next/link";

const CreateAccountSection = () => {
  return (
    <section className="mt-5 bg-[#f8f8f8]">
      <div className="mx-auto max-w-7xl px-7 sm:px-6 py-10 sm:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">

        {/* LEFT CONTENT */}
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold mb-3 sm:mb-4">
            Join Today
          </h2>

          <p className="text-gray-700 mb-5 leading-relaxed text-sm sm:text-base">
            Create your free AGPH Books account today. Explore exclusive books and manage your orders easily. Get special discounts and stay updated with new releases from India's trusted self-publishing platform.
          </p>

          <ul className="space-y-2.5 text-gray-700 mb-6 sm:mb-8 text-sm sm:text-base">
            <li>✔ Save your favourite books</li>
            <li>✔ Faster checkout & order tracking</li>
            <li>✔ Access exclusive author content</li>
            <li>✔ Get notified about new releases</li>
          </ul>

          {/* CTA BUTTONS */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded bg-black px-6 py-3 text-white text-sm font-medium hover:bg-gray-800 transition"
            >
              Create Free Account
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded border border-black px-6 py-3 text-sm font-medium hover:bg-black hover:text-white transition"
            >
              Already a Member? Sign In
            </Link>
          </div>
        </div>

        {/* RIGHT VISUAL */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mt-2 md:mt-0">
          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <h4 className="text-sm sm:text-lg font-semibold mb-1.5 sm:mb-2">Personal Library</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Access all your purchased eBooks and physical orders anytime from one place.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <h4 className="text-sm sm:text-lg font-semibold mb-1.5 sm:mb-2">Wishlist & Favourites</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Save books you love and buy them later with a single click.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <h4 className="text-sm sm:text-lg font-semibold mb-1.5 sm:mb-2">Exclusive Offers</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Get special discounts and early access to new releases.
            </p>
          </div>

          <div className="rounded-xl bg-white p-4 sm:p-6 shadow-md">
            <h4 className="text-sm sm:text-lg font-semibold mb-1.5 sm:mb-2">Author Updates</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Follow your favourite authors and never miss their latest books.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CreateAccountSection;