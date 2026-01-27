import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Exclude firebase-admin and its dependencies from server bundling
  // This fixes the @opentelemetry/api module not found error
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@opentelemetry/api",
    "@opentelemetry/sdk-trace-base",
    "@opentelemetry/semantic-conventions",
  ],
};

export default withNextIntl(nextConfig);
