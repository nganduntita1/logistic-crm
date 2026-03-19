/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config, { dev }) => {
		if (dev) {
			// Prevent stale filesystem cache from causing missing chunk/module errors in dev.
			config.cache = false
		}

		return config
	},
}

module.exports = nextConfig
