import type { Metadata } from "next";
import AuthorPage from "@/components/authors/AuthorPage";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

type Props = {
  params: Promise<{ slug: string }>;
};

async function getAuthor(slug: string) {
  const res = await fetch(`${API_URL}/api/authors/slug/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

/* ─────────────────────────────
   Dynamic SEO Metadata
───────────────────────────── */
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {

  const { slug } = await params;
  const data = await getAuthor(slug);

  if (!data?.author) {
    return {
      title: "Author Not Found | AGPH Books Store",
    };
  }

  const author = data.author;

  return {
    metadataBase: new URL(SITE_URL),

    title: `${author.name} | AGPH Books Store`,

    description:
      author.bio?.slice(0, 155) ||
      `Explore books written by ${author.name} at AGPH Books Store.`,

    alternates: {
      canonical: `${SITE_URL}/authors/${author.slug}`,
    },

    openGraph: {
      title: `${author.name} | AGPH Books Store`,
      description:
        author.bio?.slice(0, 155) ||
        `Books and biography of ${author.name}.`,
      url: `${SITE_URL}/authors/${author.slug}`,
      type: "profile",
      images: author.profile_image
        ? [
            {
              url: `${API_URL}${author.profile_image}`,
              width: 800,
              height: 800,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title: `${author.name} | AGPH Books Store`,
      description:
        author.bio?.slice(0, 155) ||
        `Books and biography of ${author.name}.`,
    },
  };
}

/* ─────────────────────────────
   Page + Schema
───────────────────────────── */
export default async function Page({ params }: Props) {

  const { slug } = await params;
  const data = await getAuthor(slug);

  if (!data?.author) {
    return <AuthorPage params={Promise.resolve({ slug })} />;
  }

  const { author } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: `${SITE_URL}/authors/${author.slug}`,
    description: author.bio || "",
    image: author.profile_image
      ? `${API_URL}${author.profile_image}`
      : undefined,
    worksFor: {
      "@type": "Organization",
      name: "AGPH Books Store",
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <AuthorPage params={Promise.resolve({ slug })} />
    </>
  );
}