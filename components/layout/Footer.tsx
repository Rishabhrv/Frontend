import Link from "next/link";
import Image from "next/image";

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.7 12a19.79 19.79 0 01-3-8.57A2 2 0 012.68 1.5h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.09a16 16 0 006 6l1.05-1.05a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const ColHeading = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-4 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
    {children}
  </h4>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link
      href={href}
      className="group relative inline-flex items-center text-white hover:text-gray-300 transition-colors duration-200 text-sm"
    >
      <span className="mr-0 group-hover:mr-1.5 w-0 group-hover:w-2 overflow-hidden transition-all duration-200 text-gray-300 font-bold">›</span>
      {children}
    </Link>
  </li>
);

const IconBox = ({ children }: { children: React.ReactNode }) => (
  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
    {children}
  </span>
);

const Footer = () => {
  const socials = [
    {
      label: "Instagram",
      href: "https://www.instagram.com/agphbooks/",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      href: "https://in.linkedin.com/company/agphbooks",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/agphbooks/",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.8v-2.9h2.8V9.5c0-2.8 1.7-4.3 4.2-4.3 1.2 0 2.5.2 2.5.2v2.7h-1.4c-1.4 0-1.8.8-1.8 1.7v2h3.1l-.5 2.9h-2.6v7A10 10 0 0022 12z" />
        </svg>
      ),
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@agphbooks",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.2a2.9 2.9 0 00-2-2C19.8 3.7 12 3.7 12 3.7s-7.8 0-9.5.5a2.9 2.9 0 00-2 2A30.7 30.7 0 000 12a30.7 30.7 0 00.5 5.8 2.9 2.9 0 002 2c1.7.5 9.5.5 9.5.5s7.8 0 9.5-.5a2.9 2.9 0 002-2A30.7 30.7 0 0024 12a30.7 30.7 0 00-.5-5.8zM9.8 15.5V8.5l6.4 3.5-6.4 3.5z" />
        </svg>
      ),
    },
    {
      label: "X",
      href: "https://x.com/agphbooks",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.9 2H22l-7.4 8.5L23 22h-6.8l-5.3-6.9L4.8 22H2l8-9.2L2 2h6.9l4.8 6.3L18.9 2z" />
        </svg>
      ),
    },
  ];

  return (
    // ← mb-16 REMOVED — FooterWithAccordion handles spacing above mobile nav
    <footer className="bg-gradient-to-br from-[#070d1c] to-[#01040f] border-t border-gray-200">

      {/* Top accent */}
      <div 
        className="h-[1px] sm:h-[3px] w-full"
        style={{ background: "linear-gradient(90deg, #e5e7eb 0%, #111 40%, #111 60%, #e5e7eb 100%)" }}
      />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-16 pt-12 pb-8">

        {/* 4-col grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-12">

          {/* COL 1: About */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex flex-col">
            <Link href="/" className="flex items-center mb-4">
              <Image src="/images/logo/agph2-200x121.webp" alt="AGPH Store Logo" width={130} height={63} priority />
            </Link>
            <p className="text-white text-xs leading-relaxed mb-4 text-justify">
              At AGPH Books Store, we believe every book carries the power to inspire, educate, and transform. With over 3 years of dedicated experience in the publishing industry, we've proudly brought more than 1,500 books to life across diverse genres, supported 2,500+ authors, and reached readers across the globe with over 50,000 copies sold.
            </p>
            <div className="inline-flex self-start items-center px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-5">
              Read · Publish · Grow
            </div>
            <div className="flex items-center gap-2 mt-auto flex-wrap">
              {socials.map(({ label, icon, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* COL 2: Explore + Legal */}
          <div className="col-span-1">
            <ColHeading>Explore</ColHeading>
            <ul className="space-y-3 mb-7">
              <FooterLink href="/ebooks">E-Books</FooterLink>
              <FooterLink href="/category/academic-books">Categories</FooterLink>
              <FooterLink href="/new-release">New Releases</FooterLink>
            </ul>
            <ColHeading>Legal</ColHeading>
            <ul className="space-y-3">
              <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink href="/terms-and-conditions">Terms & Conditions</FooterLink>
              <FooterLink href="https://agphbooks.com/contact-us/">Contact Us</FooterLink>
            </ul>
          </div>

          {/* COL 3: More */}
          <div className="col-span-1">
            <ColHeading>More</ColHeading>
            <ul className="space-y-3">
              <FooterLink href="https://agphbooks.com/publish-a-book/">Get Published</FooterLink>
              <FooterLink href="https://agphbooks.com/about-us/">About Us</FooterLink>
              <FooterLink href="https://agphbooks.com/packages/">Packages</FooterLink>
              <FooterLink href="https://agphbooks.com/blogs/">Blog</FooterLink>
            </ul>
          </div>

          {/* COL 4: Contact */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <ColHeading>Get In Touch</ColHeading>
            <div className="flex flex-col gap-5">
              <a href="https://www.google.com/maps/place/AGPH+Books" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 group">
                <IconBox>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                </IconBox>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Address</p>
                  <p className="text-white text-xs leading-relaxed group-hover:text-gray-300 transition-colors text-justify">
                    57-First Floor, Susheela Bhawan, Priyadarshini Phase-3, near Meenakshi Planet City, Shri Rameshwaram Bagmugaliya, Bhopal – 462047, MP
                  </p>
                  <p className="text-gray-400 text-[10px] mt-0.5">GSTIN: 23ABZFA2547E1ZD</p>
                </div>
              </a>

              <div className="flex items-start gap-3">
                <IconBox><PhoneIcon /></IconBox>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">Phone</p>
                  <div className="flex flex-col gap-1">
                    <a href="tel:+919981933372" className="text-white text-xs font-medium hover:text-gray-300 hover:underline underline-offset-2 transition-colors w-fit">+91-9981933372</a>
                    <a href="tel:+919981933344" className="text-white text-xs font-medium hover:text-gray-300 hover:underline underline-offset-2 transition-colors w-fit">+91-9981933344</a>
                  </div>
                </div>
              </div>

              <a href="mailto:editor@agphbooks.com" className="flex items-start gap-3 group">
                <IconBox>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </IconBox>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Email</p>
                  <p className="text-white text-xs font-medium group-hover:text-gray-300 group-hover:underline underline-offset-2 transition-colors">editor@agphbooks.com</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-800 mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} AGPH Books Store. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Read</span><span className="text-gray-600 font-bold">·</span>
            <span>Publish</span><span className="text-gray-600 font-bold">·</span>
            <span>Grow</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;