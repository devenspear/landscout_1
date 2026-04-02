import type { NextConfig } from 'next'
import { resolve } from 'path'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/dev.db'],
  },
}

export default nextConfig
