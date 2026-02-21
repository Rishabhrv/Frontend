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


export default function Home() {

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL;

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      "url": `${SITE_URL}/`,
      "name": `AGPH Store | India's Trusted Self-Publishing Bookstore Since 2022`,
      "description": "AGPH Store is India's leading self-publishing company in Bhopal, helping authors publish books with expert services since 2022.",
      "isPartOf": {
        "@id": `${SITE_URL}/#website`
      }
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "AGPH Store",
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
      "name": "AGPH Store",
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
        title="AGPH Books"
        categorySlug="agph-books"
                visibleCount={5}

      />

      <CategoryBookSection
        title="Edited Books"
        categorySlug="edit-books"
        visibleCount={5}
      />

      <Link href="/" className="flex items-center">
        <div className="rounded-lg  p-5 pb-0 pt-10 bg-white w-full">
          <Image
            src="/images/banners/banner3.png"
            alt="AGPH Store Logo"
            width={90}
            height={68}
            className="block rounded-lg w-full "
            unoptimized
          />
        </div>
      </Link>


      <CategoryBookSection
        title="LKG Books"
        categorySlug="lkg"
        visibleCount={5}
      />
      <CategoryBookSection
        title="UKG Books"
        categorySlug="ukg"
        visibleCount={5}
      />
      <CategoryBookSection
        title="Nursery Books"
        categorySlug="nursery"
        visibleCount={5}
      />
      <CategoryBookSection
        title="Pre-Nursery Books"
        categorySlug="pre-nursery"
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
