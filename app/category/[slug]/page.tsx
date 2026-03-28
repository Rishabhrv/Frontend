import type { Metadata } from "next";
import CategoryPage from "@/components/categories/CategoryPage";

const API = process.env.NEXT_PUBLIC_API_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {

  const { slug } = await params;
  const categoryName = slug.replace(/-/g, " ");

  return {
    title: `${categoryName} | AGPH Books Store`,
    description: `Browse ${categoryName} books at AGPH Books Store. Discover best sellers, latest releases, and top-rated titles.`,
    keywords: [
      `${categoryName}`,
      `Buy ${categoryName} books online`,
      "AGPH Books Store",
      "Online bookstore India",
    ],
    alternates: {
      canonical: `${SITE_URL}/category/${slug}`,
    },
    openGraph: {
      title: `${categoryName} | AGPH Books Store`,
      description: `Explore ${categoryName} books including best sellers and new arrivals.`,
      url: `${SITE_URL}/category/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryName} | AGPH Books Store`,
      description: `Shop ${categoryName} books online at AGPH Books Store.`,
    },
  };
}

export default async function Page({ params }: Props) {

  const { slug } = await params;
  const categoryName = slug.replace(/-/g, " ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${categoryName} Books`,
    url: `${SITE_URL}/category/${slug}`,
    description: `Browse ${categoryName} books at AGPH Books Store.`,
    isPartOf: {
      "@type": "WebSite",
      name: "AGPH Books Store",
      url: SITE_URL,
    },
  };

  return (
    <div >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryPage />
    </div>
  );
}