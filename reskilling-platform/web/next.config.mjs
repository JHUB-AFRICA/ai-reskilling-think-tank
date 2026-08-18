/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  // Required for GitHub Pages: export as static HTML/CSS/JS
  output: "export",
  // GitHub Pages serves the site at /repo-name/, not at /
  // Set NEXT_PUBLIC_BASE_PATH to your repo name (e.g. "ai-reskilling-think-tank")
  // Leave unset for local dev (served at /)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  // next/image doesn't work with static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
