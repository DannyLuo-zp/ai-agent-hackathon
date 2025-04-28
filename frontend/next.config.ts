import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg)$/i,
      type: 'asset/resource'
    });
    config.module.rules.push({
      test: /\.js$/,
      include: /audioWorklet/,
      type: 'asset/resource',
    });
    return config;
  }
};

export default nextConfig;
