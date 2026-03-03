import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function GET() {
  const res = await fetch(`${API_URL}/api/categories`, { cache: "no-store" });
  const categories = await res.json();

  const urls = categories
    .filter((c: any) => c.slug) // safety
    .map((c: any) => `
      <url>
        <loc>${SITE_URL}/category/${c.slug}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
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