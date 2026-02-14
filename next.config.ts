import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Exclude firebase-admin and its dependencies from server bundling
  // This fixes the @opentelemetry/api module not found error
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@google-cloud/storage",
    "@opentelemetry/api",
    "@opentelemetry/sdk-trace-base",
    "@opentelemetry/semantic-conventions",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
