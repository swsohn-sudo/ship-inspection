/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // NextAuth.js API 라우트 사용을 위해 서버 모드로 전환 (Vercel / Node.js 서버 배포)
  // 정적 export 에서는 Next.js Image Optimization 미지원 → 비활성화
  images: { unoptimized: true },

  webpack: (config, { isServer, nextRuntime, webpack }) => {
    // Edge 런타임(middleware, runtime='edge' 라우트)과 브라우저 번들은 모두
    // Node.js 내장 모듈(stream 등)을 지원하지 않으므로 browser-safe 설정 적용
    const isBrowserLike = !isServer || nextRuntime === 'edge';

    if (isBrowserLike) {
      // ExcelJS 브라우저 전용 번들로 교체 (Node.js 의존성 없는 버전)
      config.resolve.alias = {
        ...config.resolve.alias,
        exceljs: path.resolve(
          __dirname,
          'node_modules/exceljs/dist/es5/exceljs.browser.js',
        ),
      };

      // 브라우저/Edge에 없는 Node.js 내장 모듈 대체
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
        buffer: require.resolve('buffer/'),
      };
    }

    // Buffer 전역 변수 주입은 브라우저 번들에서만 필요
    // (Edge 런타임은 Buffer 내장, Node.js 서버는 글로벌 Buffer 사용)
    if (!isServer) {
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        }),
      );
    }

    return config;
  },
};

module.exports = nextConfig;
