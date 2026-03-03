import type { Metadata } from "next";
import NewReleasesPage from "@/components/new-release/NewReleasesPage";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: "New Releases | AGPH Books Store",

  description:
    "Explore the latest book releases at AGPH Books Store. Discover fresh arrivals across every category including paperback and digital editions.",

  keywords: [
    "New book releases",
    "Latest books",
    "AGPH new arrivals",
    "Recently published books",
    "Bookstore India new books",
  ],

  alternates: {
    canonical: `${SITE_URL}/new-release`,
  },

  openGraph: {
    title: "New Releases | AGPH Books Store",
    description:
      "Discover the newest titles across all categories at AGPH Books Store.",
    url: `${SITE_URL}/new-release`,
    siteName: "AGPH Books Store",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "New Releases | AGPH Books Store",
    description:
      "Browse the latest book launches and fresh arrivals at AGPH Books Store.",
  },
};

/* Structured Data */
const jsonLd = (siteUrl: string) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "New Releases",
  url: `${siteUrl}/new-release`,
  description:
    "Collection of newly released books across multiple categories.",
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
      <NewReleasesPage />
    </>
  );
}