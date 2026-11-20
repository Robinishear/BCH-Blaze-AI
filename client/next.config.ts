// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   output: "standalone",
// };

// export default nextConfig;
import type { NextConfig } from "next";

const BACKEND = new URL(process.env.NEXT_PUBLIC_API_BASE_URL as string).origin;

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/api/:path*` }];
  },
};

export default nextConfig;