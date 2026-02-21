import Link from "next/link";

const Footer = () => {
  return (
    <footer className="  bg-[#f9f9f9]">
      
      {/* ================= MAIN FOOTER ================= */}
      <div className="mx-auto max-w-7xl px-6 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 text-sm">

        {/* BRAND */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-3">
            AGPH Books Store
          </h3>
          <p className="text-gray-600 leading-relaxed mb-4">
             AGPH Books Store is India’s trusted self-publishing and eBook platform,
            connecting authors with readers across the world.
          </p>

          <p className="text-gray-500 text-xs">
            Read • Publish • Grow
          </p>
        </div>

        {/* EXPLORE */}
        <div>
          <h4 className="font-semibold mb-3">Explore</h4>
          <ul className="space-y-2 text-gray-600">
            <li><Link href="/ebooks" className="hover:underline">All Books</Link></li>
            <li><Link href="/categories" className="hover:underline">Categories</Link></li>
            <li><Link href="/bestsellers" className="hover:underline">Bestsellers</Link></li>
            <li><Link href="/new-releases" className="hover:underline">New Releases</Link></li>
          </ul>
        </div>

        {/* AUTHORS */}
        <div>
          <h4 className="font-semibold mb-3">For Authors</h4>
          <ul className="space-y-2 text-gray-600">
            <li><Link href="/publish" className="hover:underline">Publish with AGPH</Link></li>
            <li><Link href="/author-guidelines" className="hover:underline">Guidelines</Link></li>
            <li><Link href="/royalty" className="hover:underline">Royalties</Link></li>
          </ul>
        </div>

        {/* LEGAL */}
        <div>
          <h4 className="font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-gray-600">
            <li><Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link></li>
            <li><Link href="/terms-and-conditions" className="hover:underline">Terms & Conditions</Link></li>
            <li><Link href="/copyright" className="hover:underline">Copyright</Link></li>
          </ul>
        </div>

      </div>

   

      {/* ================= BOTTOM BAR ================= */}
      <div className="bg-gray-100 text-center text-xs text-gray-500 py-4">
        © {new Date().getFullYear()}   AGPH Books Store. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
