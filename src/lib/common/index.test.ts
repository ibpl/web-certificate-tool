// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import { initializeEnvironment, isSettings, type Settings } from './index';

// Check common routnes.
describe('common', () => {
	test('isSettings recognizes valid Settings', () => {
		const validSettings = <Settings>{ darkTheme: true, locale: 'en-US' };
		expect(isSettings(validSettings)).toBeTruthy();
	});

	test('isSettings recognizes invalid Settings', () => {
		expect(isSettings(1)).toBeFalsy();
		expect(isSettings({ darkTheme: 1, locale: 'en-US' })).toBeFalsy();
		expect(isSettings({ darkTheme: false, locale: 0 })).toBeFalsy();
	});

	test('initializeEnvironment does not throw errors', () => {
		expect(initializeEnvironment('/')).toBeTruthy();
	});
});
