// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import { loadTranslations } from '$lib/i18n';
import { settings, settingsInitialized } from '$lib/stores';
import { get } from 'svelte/store';
import { t } from '$lib/i18n';
import { convertToAppError } from '$lib/errors';
import lang from '$lib/i18n/lang.json';

export const CONFIG_CONTENT_TYPE = 'application/json'; // CONFIG_CONTENT_TYPE is content type of application configuration file.
export const FETCH_TIMEOUT = 10000; // FETCH_TIMEOUT is UI data fetching timeout [ms].

// Settings defines application settings.
export type Settings = {
	// darkTheme allows to set application theme mode:
	// 	when true - dark theme is used,
	// 	when false - light theme is used,
	// 	when undefined - system preference is used.
	darkTheme: boolean | undefined;

	// locale is application locale. When empty, browser locale is used.
	locale: string;
};

// isValidConfig check wheter given parameter is valid application configuration.
export function isValidConfig(arg: unknown): boolean {
	// Falsy (https://developer.mozilla.org/en-US/docs/Glossary/Falsy)
	// or something not object type is not a valid configuration.
	if (!arg || typeof arg !== 'object') {
		return false;
	}

	// darkTheme field (if present) must be boolean.
	if ('darkTheme' in arg && typeof arg.darkTheme !== 'boolean') {
		return false;
	}

	// locale field (if present) must be supported locale string.
	if ('locale' in arg && (typeof arg.locale !== 'string' || !(arg.locale in lang))) {
		return false;
	}

	// All checks passed so we assume it's a valid configurations.
	return true;
}

// tsFetch is generic fetch wrapper for fetching typed data.
async function tsFetch<T>(url: string, options = {}): Promise<T> {
	let response: Response;

	// Fetch response with connection error handling.
	try {
		const controller = new AbortController();
		const responsePromise = fetch(url, { ...options, signal: controller.signal });
		const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT);
		response = await responsePromise;
		clearTimeout(timeout);
	} catch (e) {
		throw convertToAppError(
			e,
			'tsFetch',
			/* v8 ignore next 1 */
			t.get(e instanceof Error && e.name === 'AbortError' ? 'common.timeout' : 'common.errorFetch')
		);
	}

	// Throw error if response status is not 2xx.
	if (!response.ok) {
		throw <App.Error>{
			status: response.status,
			message: t.get('common.errorFetch'),
			url: url,
			operation: 'tsFetch',
			details: response.statusText
		};
	}

	// Throw error if response content type is different than CONFIG_CONTENT_TYPE.
	const contentType = response.headers.get('Content-Type');
	if (contentType !== CONFIG_CONTENT_TYPE) {
		throw <App.Error>{
			status: 418,
			message: t.get('common.badResponse'),
			url: url,
			operation: 'tsFetch',
			details: t.get('common.badContentType', { contentType: contentType })
		};
	}

	// Throw error if response is not valid JSON.
	try {
		response = await response.json();
	} catch (e) {
		throw <App.Error>{
			status: 418,
			message: t.get('common.badResponse'),
			url: url,
			operation: 'tsFetch',
			/* v8 ignore next 1 */
			details: e instanceof Error ? e.message : (e as string)
		};
	}

	return response as T;
}

// initializeEnvironmentInternalPaths is used for serialization of
// initializeEnvironmentInternal executions, separate for distinct path (map key)
// (initializeEnvironmentInternal with given path will be called only once).
const initializeEnvironmentInternalPaths = new Map();

// initializeEnvironmentInternal initializes application environemnt for given URL.
async function initializeEnvironmentInternal(url: URL) {
	try {
		// Load translations based on browser locale for t.get()
		// work properly for error messages that may be generated
		// during other initializations below.
		await loadTranslations(window.navigator.language, url.pathname);
		/* v8 ignore next 4 */
	} catch (e) {
		// Throw error to generate +error.svelte error page.
		throw convertToAppError(e, 'loadTranslations', t.get('common.errorFetch'));
	}

	const applicationSettingsInitialized = get(settingsInitialized);
	const applicationSettings = get(settings);

	// Initialize application settings only if not already initialized.
	if (!applicationSettingsInitialized) {
		// Try to fetch settings from /config.json and use it only if fetched and validated successfully.
		const configFileUrl: string = location.protocol + '//' + location.host + '/config.json';
		try {
			const response = await tsFetch<Settings>(configFileUrl, {});
			if (!isValidConfig(response)) {
				throw <App.Error>{
					status: 418,
					message: t.get('common.badConfig'),
					url: configFileUrl,
					operation: 'initializeEnvironmentInternal'
				};
			}

			// Use theme mode from config file only if defined there.
			if (response.darkTheme !== undefined) {
				applicationSettings.darkTheme = response.darkTheme;
			}

			// Use locale from config file only if defined there.
			if (response.locale) {
				applicationSettings.locale = response.locale;
			}
		} catch (e) {
			// Ignore if config.json does not exist (HTTP 404). Display other errors.
			const err = convertToAppError(
				e,
				'initializeEnvironmentInternal',
				t.get('common.unknownError')
			);
			if (err.status !== 404) {
				throw err;
			}
		}

		// Use theme mode defined with dark_theme query parameter if present.
		const queryDarkTheme = url.searchParams.get('dark_theme');
		if (queryDarkTheme !== null) {
			switch (queryDarkTheme) {
				case '0':
					applicationSettings.darkTheme = false;
					break;
				case '1':
					applicationSettings.darkTheme = true;
					break;
				default:
					throw <App.Error>{
						status: 400,
						message: t.get('common.parameterOneOf', {
							parameter: 'dark_theme',
							set: '0, 1'
						}),
						url: url.toString()
					};
			}
		}

		// Use locale defined in locale query parameter if present.
		const queryLocale = url.searchParams.get('locale');
		if (queryLocale !== null) {
			const supportedLocales = Object.keys(lang);
			if (!supportedLocales.includes(queryLocale)) {
				throw <App.Error>{
					status: 400,
					message: t.get('common.parameterOneOf', {
						parameter: 'locale',
						set: supportedLocales.join(', ')
					}),
					url: url.toString()
				};
			}
			applicationSettings.locale = queryLocale;
		}

		// Save initialized settings in store.
		settings.set(applicationSettings);
		settingsInitialized.set(true);
	}

	// Load translations based on locale from application settings if not empty;
	// otherwise use browser's locale.
	await loadTranslations(
		applicationSettings.locale ? applicationSettings.locale : window.navigator.language,
		url.pathname
	);
}

// initializeEnvironment initializes application environment for given URL with
// protection against executing initialization in parallel.
//
// Note: initializeEnvironment must be executed on top of load function
// in every +page.ts and +layout.ts for environment to be ready for that
// load function /i.e. t.get() may not work without it/. Errors thrown
// by this function are ignored in load() in root +layout.ts but should
// not be ignored in other places.
export async function initializeEnvironment(url: URL) {
	// Start initializeEnvironmentInternal only if was not started already by another
	// async function for the same path.
	if (initializeEnvironmentInternalPaths.get(url.pathname) === undefined) {
		initializeEnvironmentInternalPaths.set(url.pathname, initializeEnvironmentInternal(url));
	}
	return initializeEnvironmentInternalPaths.get(url.pathname);
}

// resetEnvironment resets application environment.
export async function resetEnvironment() {
	initializeEnvironmentInternalPaths.clear();
	settingsInitialized.set(false);
}
