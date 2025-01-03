import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    domains: ['assets.coingecko.com'],
  },
}

export default config
