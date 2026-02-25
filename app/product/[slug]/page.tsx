import SingleProductPage from "@/components/products/SingleProductPage";
import { notFound } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {

  const { slug } = await params;

  const res = await fetch(
    `${API_URL}/api/products/slug/${slug}`,
    { cache: "no-store" }
  );

  if (!res.ok) notFound();

  const product = await res.json();

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${SITE_URL}/product/${slug}#product`,
    name: product.title,
    image: [
      `${API_URL}${product.main_image}`,
      ...product.gallery.map((g: any) => `${API_URL}${g.image_path}`)
    ],
    description: product.description.replace(/<[^>]+>/g, ""),
    sku: product.id.toString(),
    brand: {
      "@type": "Brand",
      name: "AGPH Store"
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${slug}`,
      priceCurrency: "INR",
      price: product.sell_price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema)
        }}
      />
      <SingleProductPage product={product} />
    </>
  );
}
