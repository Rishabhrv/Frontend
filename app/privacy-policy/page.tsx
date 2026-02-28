"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Shield, Mail, Cookie, Lock, Eye, Share2, Globe, Baby, RefreshCw, Phone } from "lucide-react";

const sections = [
  {
    id: "information-we-collect",
    icon: Eye,
    number: "01",
    title: "What Information We Collect",
    content: null,
    subsections: [
      {
        label: "Information You Share With Us",
        text: "This is information you give us directly — your name, email address, phone number, and anything else you provide when signing up, submitting a manuscript, buying services, or joining our newsletter.",
      },
      {
        label: "Information We Collect Automatically",
        text: "When you browse our site, we may automatically collect your IP address, browser type, device operating system, referring websites, and pages you visit. We gather this through cookies and similar tracking tools.",
      },
    ],
  },
  {
    id: "how-we-use",
    icon: Shield,
    number: "02",
    title: "How We Use Your Information",
    content: "We use your information to keep things running smoothly and make your experience better.",
    list: [
      "Provide publishing services, editing, and subscription management.",
      "Process your orders and keep you informed about them.",
      "Improve our website based on how people use it.",
      "Send newsletters or promotions — only with your consent.",
      "Respond to your questions and feedback.",
      "Ensure compliance with the law and our internal policies.",
    ],
  },
  {
    id: "who-we-share-with",
    icon: Share2,
    number: "03",
    title: "Who We Share Your Information With",
    content: "We don't sell, trade, or rent your personal info to anyone. Full stop. However, limited sharing may occur in these specific cases:",
    list: [
      "Trusted service partners (e.g. payment processors) bound by strict confidentiality.",
      "Law enforcement or regulatory bodies when legally required.",
      "New business owners in the event of a merger or acquisition.",
    ],
  },
  {
    id: "cookies",
    icon: Cookie,
    number: "04",
    title: "Cookies & Tracking",
    content: "We use cookies to remember your preferences and understand how you use our site. You can disable cookies in your browser, though some features may not function as intended. Review your browser's help documentation for instructions.",
  },
  {
    id: "data-safety",
    icon: Lock,
    number: "05",
    title: "Keeping Your Data Safe",
    content: "We implement administrative, technical, and physical safeguards to protect your data from unauthorized access or disclosure. While no system is completely impenetrable, we continuously work to maintain strong security practices.",
  },
  {
    id: "your-rights",
    icon: Shield,
    number: "06",
    title: "Your Rights",
    content: "Depending on your location, you may be entitled to certain rights regarding your personal data:",
    list: [
      "Access the personal information we hold about you.",
      "Request corrections or deletion of inaccurate data.",
      "Unsubscribe from marketing communications at any time.",
      "Restrict or object to certain types of data processing.",
    ],
  },
  {
    id: "external-links",
    icon: Globe,
    number: "07",
    title: "Links to Other Websites",
    content: "Our website may contain links to third-party sites we don't operate. We're not responsible for their privacy practices and encourage you to review their policies before sharing personal information.",
  },
  {
    id: "kids-privacy",
    icon: Baby,
    number: "08",
    title: "Children's Privacy",
    content: "Our website is not intended for children under the age of 16. We do not knowingly collect personal information from minors. If we discover we've inadvertently done so, we will promptly delete it.",
  },
  {
    id: "updates",
    icon: RefreshCw,
    number: "09",
    title: "Policy Updates",
    content: "We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. Any updates will be posted here with a revised effective date. We recommend checking back occasionally.",
  },
  {
    id: "contact",
    icon: Mail,
    number: "10",
    title: "Get in Touch",
    content: "Have questions or concerns about this policy or how we handle your data? We'd love to hear from you.",
    cta: true,
  },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("information-we-collect");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ════════════════════════════════
          HERO BAND
      ════════════════════════════════ */}
      <div className="bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <span
              className="text-[10px] uppercase tracking-[0.4em] text-gray-400"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Legal · Privacy
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tight mb-8"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Privacy 
            <span className="text-gray-500"> Policy</span>
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-10">
            <div
              className="flex items-center gap-2 text-[11px] text-gray-500 border border-gray-800 rounded-full px-4 py-2"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 inline-block" />
              Effective: September 5, 2025
            </div>
            <p
              className="text-gray-500 text-sm max-w-md leading-relaxed"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              We care about your privacy and want to be transparent about how we handle your data at{" "}
              <span className="text-gray-300">agphbooks.com</span>.
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          TWO-COLUMN LAYOUT
      ════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-16 py-16">

          {/* ── LEFT: Sticky Nav ── */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-8">
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-4"
                style={{ fontFamily: "system-ui, sans-serif" }}
              >
                Contents
              </p>
              <nav className="space-y-0.5">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-all duration-150 cursor-pointer ${
                      activeSection === s.id
                        ? "bg-gray-950 text-white font-medium"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    style={{ fontFamily: "system-ui, sans-serif" }}
                  >
                    <span
                      className={`text-[9px] tabular-nums shrink-0 ${
                        activeSection === s.id ? "text-gray-400" : "text-gray-300"
                      }`}
                    >
                      {s.number}
                    </span>
                    <span className="leading-tight">{s.title}</span>
                  </button>
                ))}
              </nav>

              {/* Bottom CTA in sidebar */}
              <div className="mt-10 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p
                  className="text-[11px] text-gray-500 mb-3 leading-relaxed"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  Questions about your privacy?
                </p>
                <Link
                  href="https://agphbooks.com/contact-us/"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-900 hover:text-gray-600 transition-colors"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  <Mail className="w-3 h-3" />
                  Contact us →
                </Link>
              </div>
            </div>
          </aside>

          {/* ── RIGHT: Content ── */}
          <main className="flex-1 min-w-0">
            <div className="divide-y divide-gray-100">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className="py-9 scroll-mt-8 first:pt-0"
                  >
                    {/* Section header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="mt-1 w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                      </div>
                      <div>
                        <span
                          className="text-[10px] uppercase tracking-[0.3em] text-gray-400 block mb-1"
                          style={{ fontFamily: "system-ui, sans-serif" }}
                        >
                          Section {section.number}
                        </span>
                        <h2
                          className="text-xl font-bold text-gray-900 leading-snug"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {section.title}
                        </h2>
                      </div>
                    </div>

                    {/* Body text */}
                    {section.content && (
                      <p
                        className="text-gray-500 text-[14px] leading-[1.9] mb-5 pl-13"
                        style={{ fontFamily: "system-ui, sans-serif", paddingLeft: "52px" }}
                      >
                        {section.content}
                      </p>
                    )}

                    {/* Subsections */}
                    {section.subsections && (
                      <div
                        className="space-y-4 mb-5"
                        style={{ paddingLeft: "52px" }}
                      >
                        {section.subsections.map((sub) => (
                          <div
                            key={sub.label}
                            className="bg-gray-50 rounded-xl p-5 border border-gray-100"
                          >
                            <p
                              className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-2"
                              style={{ fontFamily: "system-ui, sans-serif" }}
                            >
                              {sub.label}
                            </p>
                            <p
                              className="text-gray-500 text-[14px] leading-[1.85]"
                              style={{ fontFamily: "system-ui, sans-serif" }}
                            >
                              {sub.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* List */}
                    {section.list && (
                      <ul
                        className="space-y-2.5"
                        style={{ paddingLeft: "52px" }}
                      >
                        {section.list.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-[14px] text-gray-500 leading-[1.75]"
                            style={{ fontFamily: "system-ui, sans-serif" }}
                          >
                            <span className="mt-[9px] w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Contact CTA */}
                    {section.cta && (
                      <div
                        className="mt-6 flex flex-col sm:flex-row gap-3"
                        style={{ paddingLeft: "52px" }}
                      >
                        <Link
                          href="https://agphbooks.com/contact-us/"
                          className="inline-flex items-center justify-center gap-2 bg-gray-950 text-white text-[12px] font-medium uppercase tracking-[0.15em] px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                          style={{ fontFamily: "system-ui, sans-serif" }}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Contact Us
                        </Link>
                        <Link
                          href="/"
                          className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 text-[12px] font-medium uppercase tracking-[0.15em] px-6 py-3 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors duration-200"
                          style={{ fontFamily: "system-ui, sans-serif" }}
                        >
                          Back to Home
                        </Link>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}