import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Optimisation pour l'éco-conception
			runtime: 'nodejs22.x'
		})
	}
};

export default config;
