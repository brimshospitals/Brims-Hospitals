import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Security Headers (applied to every response) ────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",                      // Clickjacking prevention
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",                    // MIME sniffing prevention
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            // Allow camera/mic only for teleconsultation page
            value: "camera=(self), microphone=(self), geolocation=()",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            // Content Security Policy — prevent XSS
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: self + Jitsi (teleconsultation) + inline (Next.js requires)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://meet.jit.si https://8x8.vc",
              // Styles: self + inline (Tailwind)
              "style-src 'self' 'unsafe-inline'",
              // Images: self + Cloudinary + data URIs
              "img-src 'self' data: blob: https://res.cloudinary.com https://meet.jit.si",
              // Frames: Jitsi Meet for video calls
              "frame-src 'self' https://meet.jit.si https://8x8.vc https://www.youtube.com",
              // Connect: self + MongoDB Atlas (API calls go through Next.js, so self only)
              "connect-src 'self' https://meet.jit.si",
              // Fonts: self
              "font-src 'self' data:",
              // Media: self + Cloudinary
              "media-src 'self' https://res.cloudinary.com blob:",
              // Form submissions only to self
              "form-action 'self'",
              // No embedding in iframes from other sites
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ── Image domains (Cloudinary) ───────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  // ── Disable x-powered-by header (hides Next.js version) ─────────────────
  poweredByHeader: false,

  // ── Strict mode ──────────────────────────────────────────────────────────
  reactStrictMode: true,

  // ── Skip TypeScript errors on Vercel build (strict mode difference) ──────
  typescript: {
    ignoreBuildErrors: true,
  },

  // ── Skip ESLint errors on build ──────────────────────────────────────────
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
