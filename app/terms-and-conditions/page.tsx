"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Briefcase,
  User,
  BookOpen,
  Copyright,
  CreditCard,
  XCircle,
  AlertTriangle,
  ShoppingBag,
  Shield,
  Globe,
  Scale,
  RefreshCw,
  Mail,
} from "lucide-react";

const sections = [
  {
    id: "acceptance",
    icon: FileText,
    number: "01",
    title: "Acceptance of Terms",
    content:
      "By using our Services, you confirm that you are at least 18 years old or have the legal capacity to enter into this agreement. If you are using the Services on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.",
  },
  {
    id: "services",
    icon: Briefcase,
    number: "02",
    title: "Services Provided",
    content:
      "AG Publishing House offers academic book publishing, editorial, and related services. We reserve the right to modify, suspend, or discontinue any Service at any time, with or without notice, though we will strive to inform you of significant changes.",
    list: [
      "Manuscript submission and review",
      "Editing and formatting",
      "Publication and distribution",
      "Subscription-based access to content or services",
    ],
  },
  {
    id: "responsibilities",
    icon: User,
    number: "03",
    title: "User Responsibilities",
    content: "When using our Services, you agree to the following:",
    list: [
      "Provide accurate, complete, and current information during registration, manuscript submission, or payment.",
      "Maintain the confidentiality of your account credentials and notify us of any unauthorized use.",
      "Use the Services only for lawful purposes and in compliance with these Terms.",
      "Not submit content that is defamatory, obscene, infringing, or otherwise unlawful.",
      "Obtain and maintain any equipment or software needed to access our Services.",
    ],
  },
  {
    id: "manuscript",
    icon: BookOpen,
    number: "04",
    title: "Manuscript Submission & Publishing",
    content: null,
    subsections: [
      {
        label: "Submission Process",
        text: "When you submit a manuscript, you represent that you are the sole author or have the legal right to submit the work, that it does not infringe on any third-party intellectual property rights, and that it complies with all applicable laws and regulations.",
      },
      {
        label: "Review and Acceptance",
        text: "We reserve the right to review, accept, or reject any manuscript at our sole discretion. Submission does not guarantee publication.",
      },
      {
        label: "Publishing Agreement",
        text: "If your manuscript is accepted, you may be required to enter into a separate publishing agreement outlining rights, royalties, and other terms specific to the publication process.",
      },
    ],
  },
  {
    id: "ip",
    icon: Copyright,
    number: "05",
    title: "Intellectual Property",
    content: null,
    subsections: [
      {
        label: "Your Content",
        text: "You retain ownership of the intellectual property rights in the manuscripts or other content you submit. By submitting, you grant AG Publishing House a non-exclusive, worldwide, royalty-free license to use, reproduce, distribute, and display the content as necessary to provide the Services.",
      },
      {
        label: "Our Content",
        text: "All content on our website — including text, logos, designs, and software — is owned by or licensed to AG Publishing House and protected by copyright, trademark, and other intellectual property laws. You may not reproduce, modify, or distribute our content without prior written consent.",
      },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    number: "06",
    title: "Payments & Fees",
    content: "Some Services may require payment. By making a payment, you agree to the following:",
    list: [
      "Pay all applicable fees as described on our website or in a separate agreement.",
      "Provide accurate and complete payment information.",
      "Authorize us to charge your chosen payment method.",
      "All fees are non-refundable unless otherwise stated or required by law.",
      "We may update pricing at any time, with notice provided where feasible.",
    ],
  },
  {
    id: "termination",
    icon: XCircle,
    number: "07",
    title: "Termination",
    content:
      "We may suspend or terminate your access to the Services at our discretion, with or without notice, if you violate these Terms or engage in conduct that harms AG Publishing House, its users, or third parties. Upon termination:",
    list: [
      "Your right to use the Services will cease immediately.",
      "Any outstanding fees or obligations remain due.",
      "Provisions that by nature survive termination — such as intellectual property and liability — will remain in effect.",
    ],
  },
  {
    id: "liability",
    icon: AlertTriangle,
    number: "08",
    title: "Limitation of Liability",
    content:
      "To the fullest extent permitted by law, AG Publishing House and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Services. Our total liability for any claim will not exceed the amount you paid us in the 12 months prior to the claim. The Services are provided \"as is\" and \"as available\" without warranties of any kind.",
  },
  {
    id: "shipping",
    icon: ShoppingBag,
    number: "09",
    title: "Shipping, Cancellation & Returns",
    content: null,
    subsections: [
      {
        label: "Cancellations",
        text: "Service cancellations are permitted only if the applicable service has not yet commenced, for a full refund minus payment processing fees. Physical order cancellations are accepted only if the order has not yet been shipped.",
      },
      {
        label: "Returns",
        text: "Defective items may be returned for an exchange, return, refund, or upgrade within 7 days from the date of receipt.",
      },
      {
        label: "Shipping",
        text: "Orders within India are shipped via our courier partners or, where unavailable, India Post. All orders are processed within 3–5 business days. Delivery times are approximate and subject to courier and local conditions. Orders are not shipped on weekends or holidays. You will receive a shipment confirmation email with tracking details once your order has shipped.",
      },
    ],
  },
  {
    id: "indemnification",
    icon: Shield,
    number: "10",
    title: "Indemnification",
    content:
      "You agree to indemnify and hold harmless AG Publishing House, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, or losses arising from your use of the Services, violation of these Terms, or infringement of any third-party rights.",
  },
  {
    id: "third-party",
    icon: Globe,
    number: "11",
    title: "Third-Party Links & Services",
    content:
      "Our website may contain links to third-party websites or services. We are not responsible for the content, practices, or availability of these sites. Your use of them is at your own risk.",
  },
  {
    id: "governing-law",
    icon: Scale,
    number: "12",
    title: "Governing Law & Disputes",
    content:
      "These Terms are governed by the laws of the Republic of India, without regard to conflict of law principles. Any disputes arising from these Terms or the Services will be resolved through negotiation or, if necessary, in the appropriate courts of India.",
  },
  {
    id: "changes",
    icon: RefreshCw,
    number: "13",
    title: "Changes to These Terms",
    content:
      "We may update these Terms from time to time to reflect changes in our practices or legal requirements. We will post the updated Terms with a new effective date. Your continued use of the Services after such changes constitutes your acceptance of the updated Terms.",
  },
  {
    id: "contact",
    icon: Mail,
    number: "14",
    title: "Contact Us",
    content:
      "If you have questions, concerns, or feedback about these Terms or our Services, please reach out. We're here to help and will respond as soon as possible. Thank you for choosing AG Publishing House!",
    cta: true,
  },
];

export default function TermsAndConditionsPage() {
  const [activeSection, setActiveSection] = useState("acceptance");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
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
            <Scale className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <span
              className="text-[10px] uppercase tracking-[0.4em] text-gray-400"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Legal · Terms
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tight mb-8"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Terms &<br />
            <span className="text-gray-500">Conditions</span>
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-10">
            <div
              className="flex items-center gap-2 text-[11px] text-gray-500 border border-gray-800 rounded-full px-4 py-2"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 inline-block" />
              Effective: September 6, 2025
            </div>
            <p
              className="text-gray-500 text-sm max-w-md leading-relaxed"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              These Terms govern your use of{" "}
              <span className="text-gray-300">agphbooks.com</span> and all services
              provided by AG Publishing House. Please read them carefully.
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

              <div className="mt-10 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p
                  className="text-[11px] text-gray-500 mb-3 leading-relaxed"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  Questions about these terms?
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

                    {/* Body */}
                    {section.content && (
                      <p
                        className="text-gray-500 text-[14px] leading-[1.9] mb-5"
                        style={{ fontFamily: "system-ui, sans-serif", paddingLeft: "52px" }}
                      >
                        {section.content}
                      </p>
                    )}

                    {/* Subsections */}
                    {section.subsections && (
                      <div className="space-y-4 mb-5" style={{ paddingLeft: "52px" }}>
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
                      <ul className="space-y-2.5" style={{ paddingLeft: "52px" }}>
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

                    {/* CTA */}
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
                          href="/privacy"
                          className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 text-[12px] font-medium uppercase tracking-[0.15em] px-6 py-3 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors duration-200"
                          style={{ fontFamily: "system-ui, sans-serif" }}
                        >
                          Privacy Policy
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