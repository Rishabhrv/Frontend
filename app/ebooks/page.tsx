import type { Metadata } from "next";
import EbooksPage from "@/components/ebooks/EbooksPage";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: "eBooks Collection | AGPH Books Store",

  description:
    "Browse digital eBooks across multiple categories at AGPH Books Store. Discover PDF and EPUB editions from top authors.",

  keywords: [
    "eBooks online",
    "PDF books",
    "EPUB books",
    "Buy eBooks India",
    "AGPH digital books",
  ],

  alternates: {
    canonical: `${SITE_URL}/ebooks`,
  },

  openGraph: {
    title: "eBooks Collection | AGPH Books Store",
    description:
      "Explore digital books across categories including PDF and EPUB formats.",
    url: `${SITE_URL}/ebooks`,
    siteName: "AGPH Books Store",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "eBooks Collection | AGPH Books Store",
    description:
      "Browse digital editions and eBooks from AGPH Books Store.",
  },
};

/* Structured Data */
const jsonLd = (siteUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "eBooks Collection",
  url: `${siteUrl}/ebooks`,
  description:
    "Collection of digital eBooks including PDF and EPUB editions.",
  isPartOf: {
    "@type": "WebSite",
    name: "AGPH Books Store",
    url: siteUrl,
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
      <EbooksPage />
    </>
  );
}