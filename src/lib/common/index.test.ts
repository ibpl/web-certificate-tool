// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import { initializeEnvironment, isUISettings, type UISettings } from './index';

// Check common routnes.
describe('common', () => {
	test('isUISettings recognizes valid UISettings', () => {
		const validUISettings = <UISettings>{ darkTheme: true, locale: 'en-US' };
		expect(isUISettings(validUISettings)).toBeTruthy();
	});

	test('isUISettings recognizes invalid UISettings', () => {
		expect(isUISettings(1)).toBeFalsy();
		expect(isUISettings({ darkTheme: 1, locale: 'en-US' })).toBeFalsy();
		expect(isUISettings({ darkTheme: false, locale: 0 })).toBeFalsy();
	});

	test('initializeEnvironment does not throw errors', () => {
		expect(initializeEnvironment('/')).toBeTruthy();
	});
});
