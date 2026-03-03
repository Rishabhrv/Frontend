import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function GET() {
  const res = await fetch(`${API_URL}/api/products`, { cache: "no-store" });
  const products = await res.json();

  const urls = products
    .filter((p: any) => p.status === "published")
    .map((p: any) => `
      <url>
        <loc>${SITE_URL}/product/${p.slug}</loc>
        <lastmod>${new Date(p.date || p.created_at).toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
    `)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}