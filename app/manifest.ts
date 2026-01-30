import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AGPH Store",
    short_name: "AGPH",
    description: "Buy & download premium e-books online",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "./AGPHLOGO.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "./AGPHLOGO.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
