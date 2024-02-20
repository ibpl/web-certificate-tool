// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

// Prerender all pages for SPA.
export const prerender = true;

// Disable server side rendering even during devel in vite.
export const ssr = false;

// Remove trailing slashes from URLs — if you visit /about/, it will
// respond with a redirect to /about; this mirrors static webserver
// conventions.
export const trailingSlash = 'never';

import { initializeEnvironment } from '$lib/common';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
	// Note: any error thrown in root +layout.ts load() will break +error.svelte
	// rendering with "Uncaught (in promise)" error on console
	// (see https://kit.svelte.dev/docs/errors#responses) so any errors here will
	// be caught and ignored.

	// Only absolutely necessarry stuff should be placed in this function and only
	// inside try{} block and must be resistant to ignoring it's errors in this
	// functions

	try {
		// Note: initializeEnvironment must be executed on top of load function
		// in every +page.ts and +layout.ts for environment to be ready for that
		// load function /i.e. t.get() may not work without it/. Errors thrown
		// by this function are ignored in load() in root +layout.ts but should
		// not be ignored in other places.
		await initializeEnvironment(url.pathname);
	} catch (e) {
		// Ignore all errors (see note above).
	}

	return {};
};
