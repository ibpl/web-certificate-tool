// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import { loadTranslations } from '$lib/i18n';
import { uiSettings } from '$lib/stores';
import { get } from 'svelte/store';
import { t } from '$lib/i18n';
import { convertToAppError } from '$lib/errors';

// UISettings defines users UI settings.
export type UISettings = {
	// darkTheme allows to set application theme mode:
	// 	when true - dark theme is used,convertToAppError
	// 	when false - light theme is used,
	// 	when undefined - browser preference is used.
	darkTheme: boolean | undefined;

	// UI locale.
	locale: string;
};

// isUISettings is UISettings type guard.
export function isUISettings(arg: unknown): arg is UISettings {
	// Falsy (https://developer.mozilla.org/en-US/docs/Glossary/Falsy)
	// or something not object type is not a UISettings.
	if (!arg || typeof arg !== 'object') {
		return false;
	}

	// darkTheme field (if present) must be boolean.
	if ('darkTheme' in arg && typeof arg.darkTheme !== 'boolean') {
		return false;
	}

	// locale field must be present and be nonempty string.
	if (!('locale' in arg) || typeof arg.locale !== 'string' || arg.locale.length < 1) {
		return false;
	}

	// All checks passed so we assume it's UISettings.
	return true;
}

// initUISettings initializes UI settings.
function initUISettings() {
	// Use current settings as start point.
	const uiSettingsNew = get(uiSettings);

	// Set default browser locale if not specified already.
	if (uiSettingsNew.locale === '') {
		uiSettingsNew.locale = window.navigator.language;
		uiSettings.set(uiSettingsNew);
	}
}

// initializeEnvironmentInternalPaths is used for serialization of
// initializeEnvironmentInternal executions, separate for distinct path (map key)
// (initializeEnvironmentInternal with given path will be called only once).
const initializeEnvironmentInternalPaths = new Map();

// initializeEnvironmentInternal initializes application environemnt for given path.
async function initializeEnvironmentInternal(path: string) {
	try {
		// Load translations based on browser locale for t.get()
		// work properly for error messages that may be generated
		// during other initializations below.
		await loadTranslations(window.navigator.language, path);
		/* v8 ignore next 4 */
	} catch (e) {
		// Throw error to generate +error.svelte error page.
		throw convertToAppError(e, 'loadTranslations', t.get('common.errorFetch'));
	}

	// Initialize UI settings.
	initUISettings();

	// Load translations based on locale from UI settings.
	const settings = get(uiSettings);
	await loadTranslations(settings.locale, path);
}

// initializeEnvironment initializes application environment for given path with
// protection against executing initialization in parallel.
//
// Note: initializeEnvironment must be executed on top of load function
// in every +page.ts and +layout.ts for environment to be ready for that
// load function /i.e. t.get() may not work without it/. Errors thrown
// by this function are ignored in load() in root +layout.ts but should
// not be ignored in other places.
export async function initializeEnvironment(path: string) {
	// Start initializeEnvironmentInternal only if was not started already by another
	// async function for the same path.
	if (initializeEnvironmentInternalPaths.get(path) === undefined) {
		initializeEnvironmentInternalPaths.set(path, initializeEnvironmentInternal(path));
	}
	return initializeEnvironmentInternalPaths.get(path);
}
