/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: () => Date.now().toString(),
}
module.exports = nextConfig
