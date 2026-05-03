/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    // Ignore ESLint errors during build
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Ignore TypeScript errors during build
    typescript: {
        ignoreBuildErrors: true,
    },
    // Enable React strict mode
    reactStrictMode: true,
};

module.exports = nextConfig;