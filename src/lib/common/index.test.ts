// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import {
	checkBrowserCompatibility,
	initializeEnvironment,
	resetEnvironment,
	isValidConfig,
	FETCH_TIMEOUT,
	CONFIG_CONTENT_TYPE
} from './index';
import { server } from '../../../tests/vitest-setup';
import { HttpResponse, http } from 'msw';
import lang from '$lib/i18n/lang.json';

// Configuration validation.
describe('isValidConfig', () => {
	test('should recognize valid configurations', () => {
		expect(isValidConfig({ test: '' })).toBeTruthy();
		expect(isValidConfig({ darkTheme: true, locale: 'en', anything: 1 })).toBeTruthy();
		expect(isValidConfig({ darkTheme: false, locale: 'pl' })).toBeTruthy();
	});

	test('should recognize invalid configurations', () => {
		expect(isValidConfig(1)).toBeFalsy();
		expect(isValidConfig({ darkTheme: 1, locale: 'en' })).toBeFalsy();
		expect(isValidConfig({ darkTheme: false, locale: 0 })).toBeFalsy();
	});
});

// Browser compatibility verification.
describe('checkBrowserCompatibility', () => {
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
						darkTheme: false
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
							darkTheme: false
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
					darkTheme: false,
					dummy: 123
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).resolves.toBe(undefined);
	});

	test('should accept valid config.json with en locale and dark theme mode', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					darkTheme: true,
					locale: 'en'
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).resolves.toBe(undefined);
	});

	test('should throw error on unsupported locale in config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					darkTheme: true,
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
					darkTheme: true,
					locale: { test: 1 }
				});
			})
		);
		await expect(initializeEnvironment(new URL(window.location.href))).rejects.toThrowError(
			'Invalid configuration file content.'
		);
	});

	test('should throw error on invalid darkMode value in config.json', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					darkTheme: 'something',
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
		url.searchParams.set('dark_theme', '1');
		url.searchParams.set('locale', 'fr');
		await expect(initializeEnvironment(url)).rejects.toThrowError(
			'Parameter locale value must be one of: ' + Object.keys(lang).join(', ') + '.'
		);
	});

	test('should throw error on unsupported dark_theme in query parameters', async () => {
		server.use(
			http.get('/config.json', () => {
				return new HttpResponse(null, { status: 404 });
			})
		);
		const url = new URL(window.location.href);
		url.searchParams.set('dark_theme', '2');
		await expect(initializeEnvironment(url)).rejects.toThrowError(
			'Parameter dark_theme value must be one of: 0, 1.'
		);
	});

	test('should accept valid config.json and valid query parameters', async () => {
		server.use(
			http.get('/config.json', () => {
				return HttpResponse.json({
					darkTheme: true,
					locale: 'en'
				});
			})
		);
		const url = new URL(window.location.href);
		url.searchParams.set('dark_theme', '0');
		url.searchParams.set('locale', 'pl');
		await expect(initializeEnvironment(url)).resolves.toBe(undefined);
	});
});
