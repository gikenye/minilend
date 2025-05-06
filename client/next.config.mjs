/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Allow requests from MiniPay and other origins
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Or specify MiniPay origin
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Authorization, x-minipay-wallet, x-minipay-version, x-minipay-signature",
          },
        ],
      },
    ];
  },

  // Allow dev origins (for ngrok)
  allowedDevOrigins: ["*.ngrok-free.app"],
};

export default nextConfig;
