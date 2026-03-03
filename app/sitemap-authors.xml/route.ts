import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function GET() {
  const res = await fetch(`${API_URL}/api/authors`, { cache: "no-store" });
  const authors = await res.json();

  const urls = authors
    .filter((a: any) => a.slug)
    .map((a: any) => `
      <url>
        <loc>${SITE_URL}/author/${a.slug}</loc>
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