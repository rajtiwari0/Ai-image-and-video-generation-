/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: '**.puter.com' },
			{ protocol: 'https', hostname: '**.puterusercontent.com' },
		],
	},
};

module.exports = nextConfig;
