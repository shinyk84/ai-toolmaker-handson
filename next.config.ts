import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite(로컬 개발용 내장 DB)는 번들링하지 않고 Node에서 직접 불러옵니다.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
