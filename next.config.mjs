/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['twilio', '@supabase/supabase-js', 'node-fetch'],
  },
}

export default nextConfig
