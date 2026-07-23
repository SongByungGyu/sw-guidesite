import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "swarfarm.com", pathname: "/static/herders/images/monsters/**" }],
  },
};

export default nextConfig;
