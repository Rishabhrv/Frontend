import Image from "next/image";
import Link from "next/link";
import HeroSlider from "@/components/home/HeroSlider";
import CategoryBookSection from "@/components/books/CategoryBookSection";
import FeaturedBookSection from "@/components/home/FeaturedBookSection";
import CreateAccountSection from "@/components/home/CreateAccountSection";
import AuthorCarousel from "@/components/home/Authorcarousel";
import HomeReviewSection from "@/components/home/HomeReviewSection";
import HeroBanner from "@/components/home/HeroBanner";
import CategoryBookTab from "@/components/home/CategoryBookTab";
import TopBannerAd from "@/components/ads/TopBannerAd";
import BottomBannerAd from "@/components/ads/BottomBannerAd";
import PopupAd from "@/components/ads/PopupAd";
import type { Metadata } from "next";
import ImageSlider from "@/components/home/ImageSlider";
import Bookrecommendationsection from "@/components/home/Bookrecommendationsection";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  title:
    "AGPH Books Store | Buy Academic, Fiction & Non-Fiction Books Online",

  description:
    "Buy academic, fiction, non-fiction, authority books & eBooks online at AGPH Books Store. Explore books for every reader in India.",

  icons: {
    apple: "/public/images/logo/AGPH-Logo-Black-600x290.webp",
  },

  metadataBase: new URL(
    SITE_URL || "https://store.agphbooks.com"
  ),

  alternates: {
    canonical: "/",
  },

  keywords: [
    "AGPH Books Store",
    "Buy Books Online",
    "Online Book Store India",
    "Academic Books",
    "Fiction Books",
    "Non Fiction Books",
    "Authority Books",
    "Kids Books",
    "eBooks",
    "Educational Books",
    "Indian Book Store",
    "Books Online India",
    "Book Shop",
    "Novel Books",
    "Story Books",
    "agph books",
    "ap publhushing house",
    "Online Book Shopping",
  ],

  openGraph: {
    title:
      "AGPH Books Store | Buy Academic, Fiction & Non-Fiction Books Online",

    description:
      "Buy academic, fiction, non-fiction, authority books & eBooks online at AGPH Books Store. Explore books for every reader in India.",

    url: `${SITE_URL}/`,
    siteName: "AGPH Books Store",
    type: "website",

    images: [
      {
        url: process.env.NEXT_PUBLIC_LOGO_URL!,
        width: 1200,
        height: 630,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "AGPH Books Store | Buy Academic, Fiction & Non-Fiction Books Online",

    description:
      "Buy academic, fiction, non-fiction, authority books & eBooks online at AGPH Books Store. Explore books for every reader in India.",

    images: [process.env.NEXT_PUBLIC_LOGO_URL!],
  },
};

export default function Home() {
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL;

  const schema = {
    "@context": "https://schema.org",

    "@graph": [
      {
        "@type": "WebSite",

        "@id": `${SITE_URL}/#website`,

        "url": `${SITE_URL}/`,

        "name": "AGPH Books Store",

        "description":
          "Buy academic, fiction, non-fiction, authority books & eBooks online at AGPH Books Store. Explore books for every reader in India.",

        "publisher": {
          "@id": `${SITE_URL}/#organization`,
        },

        "potentialAction": {
          "@type": "SearchAction",

          "target":
            `${SITE_URL}/search?q={search_term_string}`,

          "query-input":
            "required name=search_term_string",
        },
      },

      {
        "@type": "Organization",

        "@id": `${SITE_URL}/#organization`,

        "name": "AGPH Books Store",

        "url": `${SITE_URL}/`,

        "logo": {
          "@type": "ImageObject",

          "url": LOGO_URL,
        },

        "sameAs": [
          process.env.NEXT_PUBLIC_FACEBOOK,
          process.env.NEXT_PUBLIC_INSTAGRAM,
          process.env.NEXT_PUBLIC_LINKEDIN,
        ],
      },

      {
        "@type": "CollectionPage",

        "@id": `${SITE_URL}/#webpage`,

        "url": `${SITE_URL}/`,

        "name":
          "AGPH Books Store | Buy Academic, Fiction & Non-Fiction Books Online",

        "description":
          "Buy academic, fiction, non-fiction, authority books & eBooks online at AGPH Books Store. Explore books for every reader in India.",

        "isPartOf": {
          "@id": `${SITE_URL}/#website`,
        },

        "inLanguage": "en-IN",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      <HeroSlider />
      <Bookrecommendationsection />
      <PopupAd pageType="home" />
      <TopBannerAd pageType="home" />
      <ImageSlider />

      <CategoryBookSection
        title="Academic Books"
        categorySlug="agph"
        visibleCount={5}
      />

      <CategoryBookSection
        title="Fiction Books"
        categorySlug="fiction"
        visibleCount={5}
      />

      <CategoryBookSection
        title="Non-Fiction Books"
        categorySlug="non-fiction"
        visibleCount={5}
      />

      <CategoryBookSection
        title="Authority Books"
        categorySlug="authority-book"
        visibleCount={5}
      />

      <CategoryBookSection
        title="Edited Books"
        categorySlug="agvolumes"
        visibleCount={5}
      />

      <Link href="/" className="flex items-center">
        <div className="rounded-lg p-5 pb-0 pt-10 bg-white w-full">
          <Image
            src="/images/banners/banner3.png"
            alt="AGPH Books Store Logo"
            width={90}
            height={68}
            className="block rounded-lg w-full"
            unoptimized
          />
        </div>
      </Link>

      <CategoryBookSection
        title="Kids"
        categorySlug="lkg"
        visibleCount={5}
      />

      <HeroBanner />
      <CategoryBookTab />
      <FeaturedBookSection />
      <AuthorCarousel />
      <HomeReviewSection />

      <BottomBannerAd pageType="home" />

      <CreateAccountSection />
    </>
  );
}