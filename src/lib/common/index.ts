// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import { loadTranslations } from '$lib/i18n';
import { settings, settingsInitialized } from '$lib/stores';
import { get } from 'svelte/store';
import { t } from '$lib/i18n';
import { convertToAppError } from '$lib/errors';
import lang from '$lib/i18n/lang.json';
import {
	PublicKeyInfo,
	PrivateKeyInfo,
	getCrypto,
	PKCS8ShroudedKeyBag,
	type ContentEncryptionAesCbcParams
} from 'pkijs';
import { fromBER } from 'asn1js';
import { Convert } from 'pvtsutils';
import FileSaver from 'file-saver';

export const CONFIG_CONTENT_TYPE = 'application/json'; // CONFIG_CONTENT_TYPE is content type of application configuration file.
export const FETCH_TIMEOUT = 10000; // FETCH_TIMEOUT is UI data fetching timeout [ms].
export const OWNER_ID_MAX_LENGTH = 300; // OWNER_ID_MAX_LENGTH owner's ID lenght limit.
export const PBKDF2_ITERATION_COUNT = 600000; // PBKDF2_ITERATION_COUNT is number of PBKDF2 iterations for key encryption.

// Settings defines application settings.
export type Settings = {
	// themeMode allows to set application theme mode; supported values:
	// 	"dark" - dark theme is used,
	// 	"light" - light theme is used,
	// 	empty string - system preference is used.
	themeMode: string;

	// locale is application locale. When empty, browser locale is used.
	locale: string;

	// ownerId is key owner's ID.
	ownerId: string;
};

// isValidConfig check wheter given parameter is valid application configuration.
export function isValidConfig(arg: unknown): boolean {
	// Falsy (https://developer.mozilla.org/en-US/docs/Glossary/Falsy)
	// or something not object type is not a valid configuration.
	if (!arg || typeof arg !== 'object') {
		return false;
	}

	// themeMode (if present) must be a string, one of: "dark", "light".
	if (
		'themeMode' in arg &&
		(typeof arg.themeMode !== 'string' || (arg.themeMode !== 'dark' && arg.themeMode !== 'light'))
	) {
		return false;
	}

	// locale field (if present) must be supported locale string.
	if ('locale' in arg && (typeof arg.locale !== 'string' || !(arg.locale in lang))) {
		return false;
	}

	// ownerId field (if present) must be non-empty string not longer than OWNER_ID_MAX_LENGTH.
	if (
		'ownerId' in arg &&
		(typeof arg.ownerId !== 'string' ||
			!(arg.ownerId.length > 0 && arg.ownerId.length <= OWNER_ID_MAX_LENGTH))
	) {
		return false;
	}

	// All checks passed so we assume it's a valid configurations.
	return true;
}

// checkBrowserCompatibility checks whether browser meets requirements and throws an error if not.
export function checkBrowserCompatibility() {
	// SubtleCrypto interface of the Web Crypto API must be available.
	if (typeof crypto === 'undefined' || !('subtle' in crypto)) {
		throw <App.Error>{
			status: 418,
			message: t.get('common.unsupportedBrowser'),
			details: t.get('common.requirementNotAvailable', {
				requirement:
					'<a href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto#browser_compatibility">SubtleCrypto</a>'
			})
		};
	}
	try {
		getCrypto();
		/* v8 ignore next 3 */
	} catch (e) {
		throw convertToAppError(e, 'pkijs.getCrypto', t.get('common.unsupportedBrowser'));
	}
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
			if (response.themeMode) {
				applicationSettings.themeMode = response.themeMode;
			}

			// Use locale from config file only if defined there.
			if (response.locale) {
				applicationSettings.locale = response.locale;
			}

			// Use owner's ID config file only if defined there.
			if (response.ownerId) {
				applicationSettings.ownerId = response.ownerId;
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

		// Use theme mode defined with tm query parameter if present.
		const queryThemeMode = url.searchParams.get('tm');
		if (queryThemeMode !== null) {
			if (queryThemeMode == 'dark' || queryThemeMode == 'light') {
				applicationSettings.themeMode = queryThemeMode;
			} else {
				throw <App.Error>{
					status: 400,
					message: t.get('common.parameterOneOf', {
						parameter: 'tm',
						set: 'light, dark'
					}),
					url: url.toString()
				};
			}
		}

		// Use locale defined in l query parameter if present.
		const queryLocale = url.searchParams.get('l');
		if (queryLocale !== null) {
			const supportedLocales = Object.keys(lang);
			if (!supportedLocales.includes(queryLocale)) {
				throw <App.Error>{
					status: 400,
					message: t.get('common.parameterOneOf', {
						parameter: 'l',
						set: supportedLocales.join(', ')
					}),
					url: url.toString()
				};
			}
			applicationSettings.locale = queryLocale;
		}

		// Use owner ID defined in oid query parameter if present.
		const queryOwnerId = url.searchParams.get('oid');
		if (queryOwnerId !== null) {
			if (!(queryOwnerId.length > 0 && queryOwnerId.length <= OWNER_ID_MAX_LENGTH)) {
				throw <App.Error>{
					status: 400,
					message: t.get('common.parameterLengthMustBeInRange', {
						parameter: 'oid',
						from: 0,
						to: OWNER_ID_MAX_LENGTH
					}),
					url: url.toString()
				};
			}
			applicationSettings.ownerId = queryOwnerId;
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

// bufferToHex convert buffer to lowercase hex string separated with ":".
export function bufferToHex(buffer: ArrayBuffer) {
	return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join(':');
}

// formatPEM formats string to have each line length equal to 64 octets.
export function formatPEM(pemString: string): string {
	// Return unmodified string if not longer than 64 chars.
	if (pemString.length <= 64) {
		return pemString;
	}
	let pemStringFormatted = '',
		wrapIndex = 0;
	for (let i = 64; i < pemString.length; i += 64) {
		pemStringFormatted += pemString.substring(wrapIndex, i) + '\n';
		wrapIndex = i;
	}
	pemStringFormatted += pemString.substring(wrapIndex, pemString.length);
	return pemStringFormatted;
}

// toPEM creates PEM content from buffer and label.
export function toPEM(buffer: BufferSource, label: string): string {
	return [
		`-----BEGIN ${label}-----`,
		formatPEM(Convert.ToBase64(buffer)),
		`-----END ${label}-----`,
		''
	].join('\n');
}

// fromPEM creates buffer from PEM content.
export function fromPEM(pem: string): ArrayBuffer {
	const base64 = pem.replace(/-{5}(BEGIN|END) .*-{5}/gm, '').replace(/\s/gm, '');
	return Convert.FromBase64(base64);
}

// publicKeyIdentifier returns public key identifier (Subject Key Identifier) from given key pair.
export async function publicKeyIdentifier(
	publicKey: CryptoKey,
	algorithm: AlgorithmIdentifier
): Promise<string> {
	const crypto = getCrypto(true);
	const publicKeyBinary = await crypto.subtle.exportKey('spki', publicKey);
	const publicKeyInfo = new PublicKeyInfo({ schema: fromBER(publicKeyBinary).result });
	return bufferToHex(
		await crypto.digest(algorithm, publicKeyInfo.subjectPublicKey.valueBlock.valueHexView)
	);
}

// downloadFile makes browser to download file with given name, content type and content.
export function downloadFile(filename: string, contentType: string, content: ArrayBuffer) {
	const file = new File([content], filename, { type: contentType });
	FileSaver.saveAs(file);
}

// downloadPKCS8 downloads given private key in PEM formatted PKCS #8 file with optional encryption
// (when password is non-empty).
export async function downloadPKCS8(kp: CryptoKeyPair, password: string, filename: string) {
	let privateKeyBinary = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
	let pemLabel = 'PRIVATE KEY';
	if (password) {
		const pkcs8Simpl = new PrivateKeyInfo({ schema: fromBER(privateKeyBinary).result });
		const pkcs8 = new PKCS8ShroudedKeyBag({ parsedValue: pkcs8Simpl });

		await pkcs8.makeInternalValues({
			password: Convert.FromUtf8String(password),
			iterationCount: PBKDF2_ITERATION_COUNT,
			hmacHashAlgorithm: 'SHA-256',
			contentEncryptionAlgorithm: <ContentEncryptionAesCbcParams>{
				name: 'AES-CBC',
				length: 256
			}
		});
		privateKeyBinary = pkcs8.toSchema().toBER(false);
		pemLabel = 'ENCRYPTED PRIVATE KEY';
	}
	downloadFile(
		filename,
		'application/x-pem-file',
		new TextEncoder().encode(toPEM(privateKeyBinary, pemLabel))
	);
}

// Callback is callback function definition.
export interface Callback {
	(): void;
}
