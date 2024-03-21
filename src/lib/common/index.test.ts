// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import {
	checkBrowserCompatibility,
	initializeEnvironment,
	resetEnvironment,
	isValidConfig,
	FETCH_TIMEOUT,
	CONFIG_CONTENT_TYPE,
	formatPEM,
	fromPEM,
	toPEM
} from './index';
import { server } from '../../../tests/vitest-setup';
import { HttpResponse, http } from 'msw';
import lang from '$lib/i18n/lang.json';
import { OWNER_ID_MAX_LENGTH } from '$lib/common';
import { getAlgorithmParameters } from 'pkijs';

// PKI.js RSASSA-PKCS1-v1_5 parameters.
describe('getAlgorithmParameters', () => {
	test('should return expected parameters for RSASSA-PKCS1-v1_5 importKey', () => {
		expect(getAlgorithmParameters('RSASSA-PKCS1-v1_5', 'importKey')).toMatchSnapshot();
	});

	test('should return expected parameters for RSASSA-PKCS1-v1_5 generateKey', () => {
		expect(getAlgorithmParameters('RSASSA-PKCS1-v1_5', 'generateKey')).toMatchSnapshot();
	});
});

// Configuration validation.
describe('isValidConfig', () => {
	test('should recognize valid configurations', () => {
		expect(isValidConfig({ test: '' })).toBeTruthy();
		expect(isValidConfig({ themeMode: 'dark', locale: 'en', anything: 1 })).toBeTruthy();
		expect(isValidConfig({ themeMode: 'light', ownerId: '1', locale: 'pl' })).toBeTruthy();
		expect(
			isValidConfig({ themeMode: 'light', ownerId: 'a'.repeat(OWNER_ID_MAX_LENGTH), locale: 'pl' })
		).toBeTruthy();
	});

	test('should recognize invalid configurations', () => {
		expect(isValidConfig(1)).toBeFalsy();
		expect(isValidConfig({ themeMode: 1, locale: 'en' })).toBeFalsy();
		expect(isValidConfig({ themeMode: 'light', locale: 0 })).toBeFalsy();
		expect(isValidConfig({ ownerId: '' })).toBeFalsy();
		expect(isValidConfig({ ownerId: { test: 'test' } })).toBeFalsy();
		expect(isValidConfig({ ownerId: 'a'.repeat(OWNER_ID_MAX_LENGTH + 1) })).toBeFalsy();
	});
});

// Browser compatibility verification.
describe('checkBrowserCompatibility', () => {
	test('should not throw an error if crypto.subtle is available', () => {
		vi.stubGlobal('crypto', { subtle: 'dummy' });
		expect(checkBrowserCompatibility()).toBe(undefined);
	});

	test('should throw error when subtle is not available in crypto', () => {
		vi.stubGlobal('crypto', { dummy: 'test' });
		expect(() => checkBrowserCompatibility()).toThrowError('Unsupported browser.');
	});
	test('should throw error when crypto is undefined', () => {
		vi.stubGlobal('crypto', undefined);
		expect(() => checkBrowserCompatibility()).toThrowError('Unsupported browser.');
	});
});

// Environment initialization.
describe('initializeEnvironment', () => {
	beforeEach(() => resetEnvironment());

	// Fake timers required for testing timeouts without delaying test.
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('should throw error on network error while fetching config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.error();
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
			'Error communicating with server.'
		);
	});

	test(
		'should throw error on request timeout while fetching config.json',
		async () => {
			server.use(
				http.get('/config.json', async () => {
					// Simulate waiting 2x longer than configured request timeout to force timeout.
					vi.advanceTimersByTime(2 * FETCH_TIMEOUT);
					return new HttpResponse(null, { status: 404 });
				})
			);
			await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
				'Error communicating with server.'
			);
		},
		FETCH_TIMEOUT + 1000
	);

	test('should throw error on response status code 403 while fetching config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return new HttpResponse(
					JSON.stringify({
						locale: 'pl',
						themeMode: 'light'
					}),
					{
						status: 403,
						statusText: 'Forbidden'
					}
				);
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
			'Error communicating with server.'
		);
	});

	test(
		'should throw error on content-type x-' + CONFIG_CONTENT_TYPE + ' while fetching config.json',
		async () => {
			server.use(
				http.get('/config.json', () => {
					return new HttpResponse(
						JSON.stringify({
							locale: 'pl',
							themeMode: 'light'
						}),
						{
							headers: {
								'content-type': 'x-' + CONFIG_CONTENT_TYPE
							}
						}
					);
				})
			);
			await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
				'Bad response from server.'
			);
		}
	);

	test('should throw error on empty config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return new HttpResponse('', {
					headers: {
						'Content-Type': CONFIG_CONTENT_TYPE
					}
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
			'Bad response from server.'
		);
	});

	test('should throw error on invalid JSON in config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return new HttpResponse('notjson', {
					headers: {
						'Content-Type': CONFIG_CONTENT_TYPE
					}
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
			'Bad response from server.'
		);
	});

	test('should accept response status code 404 while fetching config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return new HttpResponse(null, {
					status: 404,
					statusText: 'Not Found'
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).resolves.toBe(undefined);
	});

	test('should accept valid config.json without parameters', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					nothinghere: true
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).resolves.toBe(undefined);
	});

	test('should accept valid config.json with pl locale and light theme mode', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					locale: 'pl',
					themeMode: 'light',
					dummy: 123
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).resolves.toBe(undefined);
	});

	test('should accept valid config.json with en locale and dark theme mode and valid ownerId', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					themeMode: 'dark',
					locale: 'en',
					ownerId: 'test@example.com'
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).resolves.toBe(undefined);
	});

	test('should throw error on unsupported locale in config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					themeMode: 'dark',
					locale: 'EN'
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
			'Invalid configuration file content.'
		);
	});

	test('should throw error on invalid locale value in config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					themeMode: 'dark',
					locale: { test: 1 }
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
			'Invalid configuration file content.'
		);
	});

	test('should throw error on invalid themeMode value in config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					themeMode: 'something',
					locale: 'en'
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
			'Invalid configuration file content.'
		);
	});

	test('should throw error on invalid onwerId value in config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					themeMode: 'dark',
					ownerId: 1,
					locale: 'en'
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
			'Invalid configuration file content.'
		);
	});

	test('should throw error on unsupported locale in query parameters', async () => {
		server.use(
			http.get('/config.json', () => {
				return new HttpResponse(null, { status: 404 });
			})
		);
		const url = new URL(window.location.href);
		url.searchParams.set('l', 'EN');
		await expect(initializeEnvironment(url)).rejects.toThrowError(
			'Parameter l value must be one of: ' + Object.keys(lang).join(', ') + '.'
		);
	});

	test('should throw error on unsupported tm in query parameters', async () => {
		server.use(
			http.get('/config.json', () => {
				return new HttpResponse(null, { status: 404 });
			})
		);
		const url = new URL(window.location.href);
		url.searchParams.set('tm', '2');
		await expect(initializeEnvironment(url)).rejects.toThrowError(
			'Parameter tm value must be one of: light, dark.'
		);
	});

	test('should throw error on empty oid in query parameters', async () => {
		server.use(
			http.get('/config.json', () => {
				return new HttpResponse(null, { status: 404 });
			})
		);
		const url = new URL(window.location.href);
		url.searchParams.set('oid', '');
		await expect(initializeEnvironment(url)).rejects.toThrowError(
			'Parameter oid length must be in range 0-300.'
		);
	});

	test('should throw error on too long oid in query parameters', async () => {
		server.use(
			http.get('/config.json', () => {
				return new HttpResponse(null, { status: 404 });
			})
		);
		const url = new URL(window.location.href);
		url.searchParams.set('oid', 'a'.repeat(OWNER_ID_MAX_LENGTH + 1));
		await expect(initializeEnvironment(url)).rejects.toThrowError(
			'Parameter oid length must be in range 0-300.'
		);
	});

	test('should accept valid config.json and valid query parameters', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					themeMode: 'dark',
					locale: 'en',
					ownerId: 'john1@example.com.example.com.example.com'
				});
			})
		);
		const url = new URL(window.location.href);
		url.searchParams.set('oid', 'b'.repeat(OWNER_ID_MAX_LENGTH));
		url.searchParams.set('tm', 'light');
		url.searchParams.set('l', 'pl');
		await expect(initializeEnvironment(url)).resolves.toBe(undefined);
	});
});

// Crypto tools.

describe('formatPEM', () => {
	test('should return unmodified 64-chars PEM string', () => {
		expect(formatPEM('a'.repeat(64))).toBe('a'.repeat(64));
	});
});

describe('fromPEM', () => {
	test('fromPEM(toPEM()) is identity', () => {
		expect(
			new TextDecoder().decode(fromPEM(toPEM(new TextEncoder().encode('a'.repeat(64)), 'TEST')))
		).toBe('a'.repeat(64));
	});
});
