import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ebookapp.agkit.in";
const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL!;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AGPH Books Store",
    short_name: "AGPH Books",
    description:
      "AGPH Books Store is India's leading self-publishing company in Bhopal, helping authors publish books with expert services since 2022.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#000000",
    categories: ["books", "education", "shopping"],
    lang: "en-IN",
    dir: "ltr",
    icons: [
      { src: LOGO_URL, sizes: "48x48",   type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "72x72",   type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "96x96",   type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "128x128", type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "144x144", type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "152x152", type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "180x180", type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "256x256", type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "384x384", type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Academic Books",
        short_name: "Academic",
        description: "Browse our Academic Books collection",
        url: "/product-category/agph",
        icons: [{ src: LOGO_URL, sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Edited Books",
        short_name: "Edited",
        description: "Browse our Edited Books collection",
        url: "/product-category/agvolumes",
        icons: [{ src: LOGO_URL, sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Kids Books",
        short_name: "Kids",
        description: "Browse our Kids Books collection",
        url: "/product-category/agkids",
        icons: [{ src: LOGO_URL, sizes: "96x96", type: "image/png" }],
      },
      {
        name: "New Release",
        short_name: "New",
        description: "Discover the newest titles across all categories at AGPH Books Store.",
        url: "/new-release",
        icons: [{ src: LOGO_URL, sizes: "96x96", type: "image/png" }],
      },
    ],
    related_applications: [
      {
        platform: "webapp",
        url: `${SITE_URL}/manifest.webmanifest`,
      },
    ],
    prefer_related_applications: false,
  };
}