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
	type ContentEncryptionAesCbcParams,
	getAlgorithmParameters,
	RSAPublicKey,
	RSAPrivateKey,
	AlgorithmIdentifier,
	Certificate,
	PFX,
	AuthenticatedSafe,
	SafeContents,
	SafeBag,
	CertBag,
	Attribute
} from 'pkijs';
import { fromBER, Null, BitString, OctetString, BmpString } from 'asn1js';
import { Convert } from 'pvtsutils';
import FileSaver from 'file-saver';

export const CONFIG_CONTENT_TYPE = 'application/json'; // CONFIG_CONTENT_TYPE is content type of application configuration file.
export const FETCH_TIMEOUT = 10000; // FETCH_TIMEOUT is UI data fetching timeout [ms].
export const OWNER_ID_MAX_LENGTH = 300; // OWNER_ID_MAX_LENGTH owner's ID lenght limit.
export const PBKDF2_ITERATION_COUNT = 600000; // PBKDF2_ITERATION_COUNT is number of PBKDF2 iterations for key encryption.
export const HOMEPAGE_URL = 'https://github.com/ibpl/web-certificate-tool'; // HOMEPAGE_URL is application homepage's URL.

export const ENCRYPTED_PRIVKEY_PEM_REGEXP = new RegExp(
	'^\\n*-{5}BEGIN ENCRYPTED PRIVATE KEY-{5}\\n([A-Za-z0-9+/=]+\\n)+-{5}END ENCRYPTED PRIVATE KEY-{5}\\n*$',
	''
);
export const UNENCRYPTED_PRIVKEY_PEM_REGEXP = new RegExp(
	'^\\n*-{5}BEGIN PRIVATE KEY-{5}\\n([A-Za-z0-9+/=]+\\n)+-{5}END PRIVATE KEY-{5}\\n*$',
	''
);
export const CERTIFICATE_PEM_REGEXP = new RegExp(
	'^\\n*-{5}BEGIN CERTIFICATE-{5}\\n([A-Za-z0-9+/=]+\\n)+-{5}END CERTIFICATE-{5}\\n*$',
	''
);
export const PRINTABLE_ASCII_CHARACTERS_REGEXP = new RegExp('^[\x20-\x7E]*$', '');

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
			/* v8 ignore next */
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
			/* v8 ignore next */
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
		// Load translations based on browser's primary language subtag for t.get()
		// work properly for error messages that may be generated
		// during other initializations below.
		await loadTranslations(window.navigator.language.split('-')[0].toLowerCase(), url.pathname);
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
	// otherwise use browser's primary language subtag.
	await loadTranslations(
		applicationSettings.locale
			? applicationSettings.locale
			: window.navigator.language.split('-')[0].toLowerCase(),
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

// getKeyIdentifier returns key identifier (public key Subject Key Identifier) from given key pair.
export async function getKeyIdentifier(
	kp: CryptoKeyPair,
	algorithm: globalThis.AlgorithmIdentifier
): Promise<string> {
	const crypto = getCrypto(true);
	const publicKeyBinary = await crypto.exportKey('spki', kp.publicKey);
	const publicKeyInfo = new PublicKeyInfo({ schema: fromBER(publicKeyBinary).result });
	return bufferToHex(
		await crypto.digest(algorithm, publicKeyInfo.subjectPublicKey.valueBlock.valueHexView)
	);
}

// getKeyType returns key type.
export async function getKeyType(kp: CryptoKeyPair): Promise<string> {
	const crypto = getCrypto(true);
	const publicKeyBinary = await crypto.exportKey('spki', kp.publicKey);
	const publicKeyInfo = new PublicKeyInfo({ schema: fromBER(publicKeyBinary).result });

	// Get key type and size.
	if (publicKeyInfo.algorithm.algorithmId === '1.2.840.113549.1.1.1') {
		const rsaPublicKeySimple = RSAPublicKey.fromBER(
			publicKeyInfo.subjectPublicKey.valueBlock.valueHexView
		);
		const modulusView = rsaPublicKeySimple.modulus.valueBlock.valueHexView;
		let modulusBitLength = 0;
		if (modulusView[0] === 0x00)
			/* v8 ignore next */
			modulusBitLength = (rsaPublicKeySimple.modulus.valueBlock.valueHexView.byteLength - 1) * 8;
		else modulusBitLength = rsaPublicKeySimple.modulus.valueBlock.valueHexView.byteLength * 8;

		return 'RSA-' + modulusBitLength.toString();
		/* v8 ignore next 13 */
	} else if (publicKeyInfo.algorithm.algorithmId === '1.2.840.10040.4.1') {
		return 'DSA';
	} else if (publicKeyInfo.algorithm.algorithmId === '1.2.840.10045.2.1') {
		return 'ECDSA';
	} else if (publicKeyInfo.algorithm.algorithmId === '1.3.101.110') {
		return 'X25519';
	} else if (publicKeyInfo.algorithm.algorithmId === '1.3.101.112') {
		return 'ED25519';
	} else if (publicKeyInfo.algorithm.algorithmId === '1.3.101.113') {
		return 'ED448';
	}
	return t.get('common.unknown');
}

// downloadFile makes browser to download file with given name, content type and content.
export function downloadFile(filename: string, contentType: string, content: ArrayBuffer) {
	const file = new File([content], filename, { type: contentType });
	FileSaver.saveAs(file);
}

// downloadPKCS8 downloads given private key in PEM formatted PKCS #8 file with optional encryption
// (when password is non-empty).
export async function downloadPKCS8(kp: CryptoKeyPair, password: string, filename: string) {
	const crypto = getCrypto(true);
	let privateKeyBinary = await crypto.exportKey('pkcs8', kp.privateKey);
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

// downloadPKCS10 downloads given CSR PEM content in file.
export async function downloadPKCS10(csrPem: string, filename: string) {
	downloadFile(filename, 'application/x-pem-file', new TextEncoder().encode(csrPem));
}

// downloadPKCS12 downloads given private key and certificate in encrypted PKCS #12 file.
export async function downloadPKCS12(
	keyPair: CryptoKeyPair,
	certificate: Certificate,
	ownerId: string,
	password: string,
	filename: string
) {
	/* v8 ignore next 9 */
	if (!password) {
		throw new Error('password cannot be empty');
	}
	if (!ownerId) {
		throw new Error('ownerId cannot be empty');
	}
	if (!filename) {
		throw new Error('filename cannot be empty');
	}

	const crypto = getCrypto(true);
	const passwordConverted = Convert.FromUtf8String(password);
	const certFingerprint = await crypto.digest('SHA-1', certificate.toSchema().toBER(false));
	const privateKeyBinary = await crypto.exportKey('pkcs8', keyPair.privateKey);
	const pkcs8Simpl = new PrivateKeyInfo({ schema: fromBER(privateKeyBinary).result });

	// Put initial values for PKCS#12 structures.
	const pkcs12 = new PFX({
		parsedValue: {
			integrityMode: 0, // Password-Based Integrity Mode.
			authenticatedSafe: new AuthenticatedSafe({
				parsedValue: {
					safeContents: [
						{
							privacyMode: 1, // Password-Based Privacy Protection Mode.
							value: new SafeContents({
								safeBags: [
									new SafeBag({
										bagId: '1.2.840.113549.1.12.10.1.3',
										bagValue: new CertBag({
											parsedValue: certificate
										}),
										bagAttributes: [
											new Attribute({
												type: '1.2.840.113549.1.9.21', // localKeyID
												values: [new OctetString({ valueHex: certFingerprint })]
											}),
											new Attribute({
												type: '1.2.840.113549.1.9.20', // friendlyName
												values: [new BmpString({ value: ownerId })]
											})
										]
									})
								]
							})
						},
						{
							privacyMode: 0, // No-privacy Protection Mode.
							value: new SafeContents({
								safeBags: [
									new SafeBag({
										bagId: '1.2.840.113549.1.12.10.1.2',
										bagValue: new PKCS8ShroudedKeyBag({
											parsedValue: pkcs8Simpl
										}),
										bagAttributes: [
											new Attribute({
												type: '1.2.840.113549.1.9.21', // localKeyID
												values: [new OctetString({ valueHex: certFingerprint })]
											}),
											new Attribute({
												type: '1.2.840.113549.1.9.20', // friendlyName
												values: [new BmpString({ value: ownerId })]
											})
										]
									})
								]
							})
						}
					]
				}
			})
		}
	});

	// Encode internal values for PKCS8ShroudedKeyBag.
	/* v8 ignore next 3 */
	if (!(pkcs12.parsedValue && pkcs12.parsedValue.authenticatedSafe)) {
		throw new Error('pkcs12.parsedValue.authenticatedSafe is empty');
	}
	await pkcs12.parsedValue.authenticatedSafe.parsedValue.safeContents[1].value.safeBags[0].bagValue.makeInternalValues(
		{
			password: passwordConverted,
			contentEncryptionAlgorithm: {
				name: 'AES-CBC', // OpenSSL can handle AES-CBC only.
				length: 256
			},
			hmacHashAlgorithm: 'SHA-256',
			iterationCount: PBKDF2_ITERATION_COUNT
		}
	);

	// Encode internal values for all SafeContents first (create all Privacy Protection envelopes).
	await pkcs12.parsedValue.authenticatedSafe.makeInternalValues({
		safeContents: [
			{
				password: passwordConverted,
				contentEncryptionAlgorithm: {
					name: 'AES-CBC', // OpenSSL can handle AES-CBC only.
					length: 256
				},
				hmacHashAlgorithm: 'SHA-256',
				iterationCount: PBKDF2_ITERATION_COUNT
			},
			{
				// Empty parameters for second SafeContent since No Privacy protection mode there.
			}
		]
	});

	// Encode internal values for Integrity Protection envelope.
	await pkcs12.makeInternalValues({
		password: passwordConverted,
		iterations: PBKDF2_ITERATION_COUNT, // Big value here causes long generation time. See https://github.com/PeculiarVentures/PKI.js/issues/403
		pbkdf2HashAlgorithm: 'SHA-256', // Least two parameters are equal because at the moment it is not clear how to use PBMAC1 schema with PKCS#12 integrity protection.
		hmacHashAlgorithm: 'SHA-256'
	});

	// Download prepared PKCS #12 content to file.
	downloadFile(filename, 'application/pkcs12', pkcs12.toSchema().toBER(false));
}

// readFile reads specified file content (with mac and wiondows newlines
// converted to \n) and returns it or rejects with error.
export function readFileAsText(file: File) {
	return new Promise<string>((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.onload = () => {
			/* v8 ignore next 3*/
			resolve(
				typeof fileReader.result == 'string' ? fileReader.result.replace(/(?:\r\n|\r)/g, '\n') : ''
			);
		};
		/* v8 ignore next */
		fileReader.onerror = (error) => reject(error);
		fileReader.readAsText(file);
	});
}

export let publicKeyInfo: PublicKeyInfo;

// loadPKCS8 loads given private key from given PEM formatted PKCS #8 file with decryption
// with given password if key is encrypted. The only key type supported now is RSASSA-PKCS1-v1_5.
export async function loadPKCS8(file: File, password: string): Promise<CryptoKeyPair> {
	// Read specified file content and verify if its PEM formatted private key (with optional encryption).
	const fileContent = await readFileAsText(file);

	// isEncrypted is true if file contains encrypted private key.
	let isEncrypted = false;

	if (ENCRYPTED_PRIVKEY_PEM_REGEXP.test(fileContent)) {
		isEncrypted = true;
	} else if (!UNENCRYPTED_PRIVKEY_PEM_REGEXP.test(fileContent)) {
		throw Error(t.get('dashboard.noPrivateKeyPEMFound'));
	}

	// Import private key.
	const crypto = getCrypto(true);
	const privateKeyDER = fromPEM(fileContent);
	const algorithmParameters = getAlgorithmParameters('RSASSA-PKCS1-v1_5', 'importKey');
	// eslint-disable-next-line no-undef
	const rsaAlgorithmParameters = <RsaHashedImportParams>algorithmParameters.algorithm;
	let privateKey: CryptoKey;
	let privateKeyInfo: PrivateKeyInfo;

	// Decrypt key if encrypted.
	if (isEncrypted) {
		const pkcs8 = new PKCS8ShroudedKeyBag({ schema: fromBER(privateKeyDER).result });
		try {
			// Remove comments below when https://github.com/PeculiarVentures/PKI.js/issues/399 is resolved.
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			await pkcs8.parseInternalValues({ password: Convert.FromUtf8String(password) });
		} catch (e) {
			throw Error(t.get('dashboard.invalidPasswordOrUnsupportedKey', { url: HOMEPAGE_URL }));
		}
		if (pkcs8.parsedValue) {
			try {
				privateKeyInfo = pkcs8.parsedValue;
				privateKey = await crypto.importKey(
					'pkcs8',
					privateKeyInfo.toSchema().toBER(false),
					rsaAlgorithmParameters,
					true,
					['sign']
				);
			} catch (e) {
				throw Error(t.get('dashboard.invalidOrUnsupportedKey', { url: HOMEPAGE_URL }));
			}
			/* v8 ignore next 3 */
		} else {
			throw Error(t.get('dashboard.invalidOrUnsupportedKey', { url: HOMEPAGE_URL }));
		}
	} else {
		try {
			privateKeyInfo = new PrivateKeyInfo({ schema: fromBER(privateKeyDER).result });
			privateKey = await crypto.importKey('pkcs8', privateKeyDER, rsaAlgorithmParameters, true, [
				'sign'
			]);
		} catch (e) {
			throw Error(t.get('dashboard.invalidOrUnsupportedKey', { url: HOMEPAGE_URL }));
		}
	}
	const privateRSAKey = <RSAPrivateKey>privateKeyInfo.parsedKey;

	// Generate and import public RSA key from public key data stored with imported private key.
	const publicRSAKey = new RSAPublicKey({
		modulus: privateRSAKey.modulus,
		publicExponent: privateRSAKey.publicExponent
	});

	const algorithmIdentifier = new AlgorithmIdentifier({
		algorithmId: '1.2.840.113549.1.1.1', // RSA
		algorithmParams: new Null()
	});

	publicKeyInfo = new PublicKeyInfo({
		parsedKey: publicRSAKey,
		algorithm: algorithmIdentifier,
		subjectPublicKey: new BitString({ valueHex: publicRSAKey.toSchema().toBER(false) })
	});

	const publicKey = await crypto.importKey(
		'spki',
		publicKeyInfo.toSchema().toBER(false),
		rsaAlgorithmParameters,
		true,
		algorithmParameters.usages
	);

	// Return prepared key pair.
	return <CryptoKeyPair>{ privateKey: privateKey, publicKey: publicKey };
}

// Callback is callback function definition.
export interface Callback {
	(): void;
}
