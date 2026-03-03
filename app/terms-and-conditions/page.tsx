import type { Metadata } from "next";
import TermsAndConditionsPage from "@/components/terms-and-conditions/TermsAndConditionsPage";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: "Terms & Conditions | AGPH Books Store",

  description:
    "Read the official Terms and Conditions of AGPH Books Store. Learn about payments, shipping, intellectual property, cancellations, and governing law.",

  keywords: [
    "AGPH Books Store terms",
    "Bookstore terms and conditions",
    "Publishing terms India",
  ],

  alternates: {
    canonical: `${SITE_URL}/terms`,
  },

  openGraph: {
    title: "Terms & Conditions | AGPH Books Store",
    description:
      "Official Terms and Conditions governing use of AGPH Books Store services.",
    url: `${SITE_URL}/terms`,
    siteName: "AGPH Books Store",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Terms & Conditions | AGPH Books Store",
    description:
      "Read the official Terms and Conditions of AGPH Books Store.",
  },
};

/* Structured Data */
const jsonLd = (siteUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "TermsOfService",
  name: "Terms & Conditions",
  url: `${siteUrl}/terms`,
  description:
    "Terms and Conditions governing the use of AGPH Books Store services.",
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
      <TermsAndConditionsPage />
    </>
  );
}