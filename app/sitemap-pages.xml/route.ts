import { NextResponse } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function GET() {
  const now = new Date().toISOString();

  const staticPages = [
    { path: "/",                     priority: "1.0", changefreq: "daily" },
    { path: "/ebooks",               priority: "0.9", changefreq: "daily" },
    { path: "/new-release",          priority: "0.8", changefreq: "daily" },
    { path: "/privacy-policy",       priority: "0.3", changefreq: "monthly" },
    { path: "/terms-and-conditions", priority: "0.3", changefreq: "monthly" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`).join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}