import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Dev server only: serve the packs in content-packs/local/ so the app installs them
 * automatically on localhost. Nothing here is part of the production build.
 */
function localPacks(): Plugin {
	const dir = 'content-packs/local';
	return {
		name: 'local-packs',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/__local-packs.json', (_req, res) => {
				const packs = existsSync(dir)
					? readdirSync(dir)
							.filter((f) => f.endsWith('.json'))
							.flatMap((f) => {
								try {
									return [JSON.parse(readFileSync(join(dir, f), 'utf8'))];
								} catch {
									return [];
								}
							})
					: [];
				res.setHeader('Content-Type', 'application/json');
				res.setHeader('Cache-Control', 'no-store');
				res.end(JSON.stringify(packs));
			});
		}
	};
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), localPacks()]
});
