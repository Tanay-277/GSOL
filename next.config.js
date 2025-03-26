/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Include images from trusted domains if needed
  images: {
    domains: [], 
    remotePatterns: [],
  },
  // Add security headers for mental health application
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent XSS attacks
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Block MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Content Security Policy to prevent various attacks
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*; img-src 'self' data: https://*; style-src 'self' 'unsafe-inline'; font-src 'self' data:;",
          },
          // Set strict HTTPS for at least 1 year (mental health data should be secure)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Disable features that might be used to track users
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // Indicate that this site provides a mental health service for appropriate handling
          {
            key: 'X-Mental-Health-Service',
            value: 'true',
          },
          // Prevent the browser from sending the referrer header when navigating away from the site
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Configure redirects to enhance user experience and ensure users find help
  async redirects() {
    return [
      {
        source: '/help',
        destination: '/onboarding',
        permanent: false,
      },
      {
        source: '/assessment',
        destination: '/onboarding',
        permanent: false,
      },
      {
        source: '/resources',
        destination: '/dashboard',
        permanent: false,
      },
      // Ensure users are redirected to relevant pages
      {
        source: '/mental-health',
        destination: '/onboarding',
        permanent: false,
      },
    ];
  },
  // Configure proper error pages for production
  webpack(config) {
    return config;
  },
};

module.exports = nextConfig;