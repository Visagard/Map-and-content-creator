/** @type {import('next').NextConfig} */
const nextConfig = {
  // Čistě klientská aplikace → statický export, hostovatelný zdarma (GitHub Pages / Netlify / Vercel).
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  // Konva běží jen v prohlížeči; na serveru ho nikdy nebundlujeme.
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
