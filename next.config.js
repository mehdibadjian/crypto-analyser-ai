/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add custom webpack configuration here if needed
    return config
  }
}

module.exports = nextConfig
