import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    rules: {
      '*.svg': [
        // *.svg?url → 従来通りURL文字列としてimport（next/image等で使用）
        {
          condition: { query: /url/ },
          type: 'asset',
        },
        // それ以外の *.svg → SVGRでReactコンポーネント化
        {
          condition: { not: { query: /url/ } },
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      ],
    },
  },
};

export default nextConfig;
