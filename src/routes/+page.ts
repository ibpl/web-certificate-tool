// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import type { PageLoad } from './$types';
import { initializeEnvironment, checkBrowserCompatibility } from '$lib/common';

export const load = (async ({ url }) => {
	// Note: initializeEnvironment must be executed on top of load function
	// in every +page.ts and +layout.ts for environment to be ready for that
	// load function /i.e. t.get() may not work without it/. Errors thrown
	// by this function are ignored in load() in root +layout.ts but should
	// not be ignored in other places.
	await initializeEnvironment(url);

	// Check for browser compatibility and throw an error if browser does not meet requirements.
	checkBrowserCompatibility();

	return {};
}) satisfies PageLoad;
