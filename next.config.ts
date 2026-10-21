import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static export: served from S3 + CloudFront, rebuilt on Sanity publish.
  output: "export",
  trailingSlash: true,
  // `npm run dev` without SST: fall back to the plain names from .env.
  env: {
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID ?? "",
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET ?? process.env.SANITY_DATASET ?? "production",
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/sanity-image-loader.ts",
  },
};

export default nextConfig;
