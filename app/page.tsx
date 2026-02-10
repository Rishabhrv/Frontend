import Image from "next/image";
import Link from "next/link";
import HeroSlider from "@/components/home/HeroSlider";
import CategoryBookSection from "@/components/books/CategoryBookSection";
import FeaturedBookSection from "@/components/home/FeaturedBookSection";
import CreateAccountSection from "@/components/home/CreateAccountSection";

export default function Home() {
  return (
    <>
      <HeroSlider />
      {/* other sections */}
       <CategoryBookSection
        title="Best Seller"
        categorySlug="best-seller"
                visibleCount={6}

      />

      <CategoryBookSection
        title="AGPH Books"
        categorySlug="agph-books"
                visibleCount={6}

      />

      <CategoryBookSection
        title="AG Volumes"
        categorySlug="ag-volumes"
        visibleCount={6}
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
        title="AGPH"
        categorySlug="agph"
                visibleCount={6}

      />
      
      <FeaturedBookSection />

      <CategoryBookSection
        title="AG Kids"
        categorySlug="ag-kids"
                visibleCount={6}

      />
      
      <CreateAccountSection />
    </>
  );
}
