// import { createAuthClient } from "better-auth/react";

// const BACKEND_ORIGIN = new URL(process.env.NEXT_PUBLIC_API_BASE_URL as string).origin;

// export const authClient = createAuthClient({ baseURL: BACKEND_ORIGIN });
// export const socialLogin = (provider: "google" | "github") =>
//   authClient.signIn.social({
//     provider,
//     callbackURL: `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/social/success`,
//     errorCallbackURL: `${window.location.origin}/login`,
//   });
import type { NextConfig } from "next";

const BACKEND = new URL(process.env.NEXT_PUBLIC_API_BASE_URL as string).origin;

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/api/:path*` }];
  },
};

export default nextConfig;