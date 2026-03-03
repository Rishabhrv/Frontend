import type { Metadata } from "next";
import PrivacyPolicyPage from "@/components/privacy-policy/PrivacyPolicyPage";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: "Privacy Policy | AGPH Books Store",

  description:
    "Read the Privacy Policy of AGPH Books Store. Learn how we collect, use, and protect your personal information.",

  keywords: [
    "AGPH Books Store privacy policy",
    "Bookstore privacy policy India",
    "Data protection AGPH",
  ],

  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },

  openGraph: {
    title: "Privacy Policy | AGPH Books Store",
    description:
      "Understand how AGPH Books Store collects, uses, and safeguards your personal data.",
    url: `${SITE_URL}/privacy-policy`,
    siteName: "AGPH Books Store",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | AGPH Books Store",
    description:
      "Learn how AGPH Books Store protects and manages your personal data.",
  },
};

const jsonLd = (siteUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "PrivacyPolicy",
  name: "Privacy Policy",
  url: `${siteUrl}/privacy-policy`,
  description:
    "Privacy Policy outlining how AGPH Books Store collects, uses, and protects personal data.",
  publisher: {
    "@type": "Organization",
    name: "AGPH Books Store",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo.png`,
    },
  },
});

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd(SITE_URL)),
        }}
      />
      <PrivacyPolicyPage />
    </>
  );
}