import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/uploads/**",
      },
    ],
  },
  
  // If you are deploying to a sub-folder or a specific VPS path, 
  // you might need to add 'output: "standalone"' here.
};

export default nextConfig; 