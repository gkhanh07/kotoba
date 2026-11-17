import type { NextConfig } from "next";

// Dev only: Next serves its client chunks and HMR socket to localhost alone. Opened from any other host
// (http://127.0.0.1:3000, or this machine's address from another device), the page never hydrates and every
// client-side control does nothing. Extra hosts come from ALLOWED_DEV_ORIGINS (comma-separated hostnames, see
// .env.example), so no machine address is committed. Next loads .env* before it reads this file.
const LOOPBACK_HOST = "127.0.0.1";

const extraDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter((host) => host.length > 0);

const nextConfig: NextConfig = {
  allowedDevOrigins: [LOOPBACK_HOST, ...extraDevOrigins],
};

export default nextConfig;
