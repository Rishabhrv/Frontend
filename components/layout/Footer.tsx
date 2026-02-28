import Link from "next/link";

// ── Sub-components ──────────────────────────────────────────────

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.7 12a19.79 19.79 0 01-3-8.57A2 2 0 012.68 1.5h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.09a16 16 0 006 6l1.05-1.05a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const ColHeading = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-5 font-semibold" style={{ fontFamily: "system-ui, sans-serif" }}>
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

// ── Footer ──────────────────────────────────────────────────────

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-[#070d1c] to-[#01040f] border-t border-gray-200">

      {/* thin top accent */}
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #e5e7eb 0%, #111 40%, #111 60%, #e5e7eb 100%)" }} />

      <div className="mx-auto  px-25 pt-14 pb-8">

        {/* ═══════════════ 4-COLUMN GRID ═══════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* ── COL 1: About ── */}
          <div className="flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ fontFamily: "Georgia, serif" }}
              >
                A
              </div>
              <span className="text-white font-bold text-base tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                AGPH Books Store
              </span>
            </div>

            <p className="text-white text-sm leading-relaxed mb-5">
              India's trusted self-publishing and eBook platform — connecting authors with
              readers across the world. Write your story. Let the world read it.
            </p>

            {/* Tagline badge */}
            <div className="inline-flex self-start items-center px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-6">
              Read · Publish · Grow
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2.5 mt-auto">
            {[
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
            ].map(({ label, icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
              >
                {icon}
              </a>
            ))}
            </div>
          </div>

          {/* ── COL 2: Explore + Legal ── */}
          <div>
            <ColHeading>Explore</ColHeading>
            <ul className="space-y-3 mb-8 ">
              <FooterLink href="/ebooks">E-Books</FooterLink>
              <FooterLink href="/category/academic-books">Categories</FooterLink>
              <FooterLink href="/new-releases">New Releases</FooterLink>
            </ul>

            <ColHeading>Legal</ColHeading>
            <ul className="space-y-3">
              <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink href="/terms-and-conditions">Terms & Conditions</FooterLink>
              <FooterLink href="https://agphbooks.com/contact-us/">Contact Us</FooterLink>
            </ul>
          </div>

          {/* ── COL 3: Authors + Newsletter ── */}
          <div>
            <ColHeading>More</ColHeading>
            <ul className="space-y-3 mb-8">
              <FooterLink href="https://agphbooks.com/publish-a-book/">Publish with AGPH</FooterLink>
              <FooterLink href="https://agphbooks.com/about-us/">About Us</FooterLink>
            </ul>

          </div>

          {/* ── COL 4: Contact + Map ── */}
          <div>
            <ColHeading>Get In Touch</ColHeading>

            <div className="flex flex-col gap-5">

              {/* Map */}
              <div className="w-full h-36 rounded-xl overflow-hidden border border-gray-200">
<iframe
  title="AGPH Office Location"
  src="https://www.google.com/maps?q=AGPH+Books+AG+Publishing+House+Bhopal&output=embed"
  width="100%"
  height="100%"
  style={{ border: 0 }}
  allowFullScreen
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
/>
              </div>

              {/* Address */}
              <a
                href="https://www.google.com/maps/place/AGPH+Books+%7C+AG+Publishing+House+%7C+Best+Academic+Book+Publishers+in+Bhopal+%7C+Book+Publishing+Packages+India/@23.185636,77.4780062,703m/data=!3m2!1e3!4b1!4m6!3m5!1s0x397c4729c93f4ad5:0x6c2a6292c28245e7!8m2!3d23.185636!4d77.4780062!16s%2Fg%2F11pkltsfyw?entry=ttu&g_ep=EgoyMDI2MDIyNC4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 group"
              >
                <IconBox>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </IconBox>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Address</p>
                  <p className="text-white text-xs leading-relaxed group-hover:text-gray-300 transition-colors text-justify">
                    57-First Floor, Susheela Bhawan, Priyadarshini Phase-3,
                     near Meenakshi Planet City, Shri Rameshwaram
                    Bagmugaliya, Bhopal – 462047, MP
                  </p>
                  <p className="text-gray-400 text-[10px] mt-0.5">GSTIN: 23ABZFA2547E1ZD</p>
                </div>
              </a>

              {/* Phone — two separate clickable numbers */}
              <div className="flex items-start gap-3">
                <IconBox>
                  <PhoneIcon />
                </IconBox>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">Phone</p>
                  <div className="flex flex-col gap-1">
                    <a
                      href="tel:+919981933372"
                      className="text-white text-xs font-medium hover:text-gray-300 hover:underline underline-offset-2 transition-colors w-fit"
                    >
                      +91-9981933372
                    </a>
                    <a
                      href="tel:+919981933344"
                      className="text-white text-xs font-medium hover:text-gray-300 hover:underline underline-offset-2 transition-colors w-fit"
                    >
                      +91-9981933344
                    </a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <a href="mailto:editor@agphbooks.com" className="flex items-start gap-3 group">
                <IconBox>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </IconBox>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">Email</p>
                  <p className="text-white text-xs font-medium group-hover:text-gray-300 group-hover:underline underline-offset-2 transition-colors">
                    editor@agphbooks.com
                  </p>
                </div>
              </a>

            </div>
          </div>

        </div>

        {/* ── Divider ── */}
        <div className="w-full h-px bg-gray-200 mb-6" />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} AGPH Books Store. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>Read</span>
            <span className="text-gray-900 font-bold">·</span>
            <span>Publish</span>
            <span className="text-gray-900 font-bold">·</span>
            <span>Grow</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;