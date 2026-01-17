/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Disable ESLint during build to avoid rule definition errors
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Disable TypeScript errors during build (optional)
    typescript: {
        ignoreBuildErrors: false,
    },
}

module.exports = nextConfig
