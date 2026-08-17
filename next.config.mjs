import { withSentryConfig } from "@sentry/nextjs";

const isDevelopment = process.env.NODE_ENV === "development";

export const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.clarity.ms https://apis.google.com https://pagead2.googlesyndication.com`,
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https://*.supabase.co https://drive.google.com https://*.googleusercontent.com https://www.google-analytics.com https://*.clarity.ms https://*.bing.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googleapis.com https://oauth2.googleapis.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://pagead2.googlesyndication.com",
  "media-src 'self' blob: https://*.supabase.co",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src https://accounts.google.com https://docs.google.com https://drive.google.com https://picker.googleapis.com",
  "manifest-src 'self'",
].join("; ");

export const securityHeaders = [
  {
    key: "Content-Security-Policy-Report-Only",
    value: contentSecurityPolicyReportOnly,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  telemetry: false,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
      removeTracing: true,
    },
  },
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
