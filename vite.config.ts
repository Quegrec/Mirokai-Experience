import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		// Éco-conception : optimisation des assets
		cssMinify: true,
		minify: 'esbuild',
		rollupOptions: {
			output: {
				manualChunks: undefined
			}
		}
	}
});
