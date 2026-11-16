import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({ fallback: '404.html' }),
		// GitHub Pages serves the site from /<repo>/, so the deploy workflow sets BASE_PATH.
		// Locally and on any host at the root it stays empty.
		paths: { base: process.env.BASE_PATH ?? '' }
	}
};

export default config;
