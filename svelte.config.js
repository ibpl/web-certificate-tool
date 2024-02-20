// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',

			// Fallback page to be served when file is not found on server
			// (in SPA mode, client side router must handle it).
			fallback: '200.html',

			// Generate compressed versions of static files (brotli and gzip) to
			// allow serving it instead of uncompressed version if client supports it.
			precompress: true,

			strict: true
		})
	}
};

export default config;
