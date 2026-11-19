/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.dreamstime.com",
      },
      {
        protocol: "https",
        hostname: "img.pikbest.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "www.watchmojo.com",
      },
      {
        protocol: "https",
        hostname: "www.pexels.com",
      },
      {
        protocol: "https",
        hostname: "www.thepinnaclelist.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "cdn.dummyjson.com",
      },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "localhost", port: "5000" },
    ],
  },
};

export default nextConfig;
