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
import type { Metadata } from "next";


const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;


export const metadata: Metadata = {
  title: "AGPH Books Store | India's Trusted Self-Publishing Since 2022",
  description:
    "AGPH Books Store is India’s leading self-publishing company in Bhopal, helping authors publish books with expert services since 2022.",
  metadataBase: new URL(SITE_URL || "https://ebookapp.agkit.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AGPH Books Store | India's Trusted Self-Publishing Since 2022",
    description:
      "AGPH Books Store is India’s leading self-publishing company in Bhopal, helping authors publish books with expert services since 2022.",
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
    title: "AGPH Books Store | India's Trusted Self-Publishing Since 2022",
    description:
      "AGPH Books Store is India’s leading self-publishing company in Bhopal, helping authors publish books with expert services since 2022.",
    images: [process.env.NEXT_PUBLIC_LOGO_URL!],
  },
};


export default function Home() {

const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL;

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      "url": `${SITE_URL}/`,
      "name": `AGPH Books Store | India's Trusted Self-Publishing Since 2022`,
      "description": "AGPH Books Store is India’s leading self-publishing company in Bhopal, helping authors publish books with expert services since 2022",
      "inLanguage": "en-IN",
      "isPartOf": {
        "@id": `${SITE_URL}/#website`
      }
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "AGPH Books Store",
      "url": `${SITE_URL}/`,
      "logo": {
        "@type": "ImageObject",
        "url": LOGO_URL
      },
      "sameAs": [
        process.env.NEXT_PUBLIC_FACEBOOK,
        process.env.NEXT_PUBLIC_INSTAGRAM,
        process.env.NEXT_PUBLIC_LINKEDIN
      ]
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": `${SITE_URL}/`,
      "name": "AGPH Books Store",
      "publisher": {
        "@id": `${SITE_URL}/#organization`
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SITE_URL}/?s={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  ]
};

  return (
    <>

    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />

    <HeroSlider />

      <CategoryBookSection
        title="Academic Books"
        categorySlug="academic-books"
                visibleCount={5}

      />

      <CategoryBookSection
        title="Edited Books"
        categorySlug="edited-books"
        visibleCount={5}
      />

      <Link href="/" className="flex items-center">
        <div className="rounded-lg  p-5 pb-0 pt-10 bg-white w-full">
          <Image
            src="/images/banners/banner3.png"
            alt="AGPH Books Store Logo"
            width={90}
            height={68}
            className="block rounded-lg w-full "
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
    <CreateAccountSection />
    </>
  );
}
