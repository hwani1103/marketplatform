/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@market-regime/database', '@market-regime/types'],
}

module.exports = nextConfig
