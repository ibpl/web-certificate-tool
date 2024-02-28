// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import Page from './Page.svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { mdiWhiteBalanceSunny, mdiWeatherNight, mdiThemeLightDark } from '@mdi/js';

describe('Page', () => {
	test('page with enabled content is rendered correctly', () => {
		const { container } = render(Page, { props: { contentEnabled: true } });

		const div = container.querySelector('.disabled');
		expect(div).toBeFalsy();
	});

	test('page with disabled content is rendered correctly', () => {
		const { container } = render(Page, { props: { contentEnabled: false } });
		const div = container.querySelector('.disabled');
		expect(div).toBeTruthy();
	});

	test('default page title works', () => {
		render(Page, { props: { contentEnabled: false, title: '' } });
		const title = screen.getByTestId('page-title');
		expect(title.innerHTML).toBe('Web Certificate Tool');
	});

	test('custom page title works', () => {
		render(Page, { props: { contentEnabled: false, title: 'title123' } });
		const title = screen.getByTestId('page-title');
		expect(title.innerHTML).toBe('title123');
	});

	test('language changing works', async () => {
		const user = userEvent.setup();
		render(Page, { props: { contentEnabled: true } });
		const title = screen.getByTestId('page-title');

		// Default (EN)
		expect(title.innerHTML).toBe('Web Certificate Tool');
		const buttonLanguage = screen.getByTestId('button-language');

		// PL
		await user.click(buttonLanguage);
		const menuLanguagePL = screen.getByTestId('menu-language-pl');
		await user.click(menuLanguagePL);
		expect(title.innerHTML).toBe('Webowe narzędzie do certyfikatów');

		// EN
		await user.click(buttonLanguage);
		const menuLanguageEN = screen.getByTestId('menu-language-en');
		await user.click(menuLanguageEN);
		expect(title.innerHTML).toBe('Web Certificate Tool');
	});

	test('theme mode changing works', async () => {
		const user = userEvent.setup();
		render(Page, { props: { contentEnabled: true } });
		const buttonThemeMode = screen.getByTestId('button-theme-mode');
		const buttonThemeModeIconPath = screen.getByTestId('button-theme-mode-icon-path');

		// Light theme mode.
		await user.click(buttonThemeMode);
		await user.click(screen.getByTestId('menu-theme-mode-1'));
		expect(buttonThemeModeIconPath.getAttribute('d')).toBe(mdiWhiteBalanceSunny);

		// System theme mode.
		await user.click(buttonThemeMode);
		await user.click(screen.getByTestId('menu-theme-mode-2'));
		expect(buttonThemeModeIconPath.getAttribute('d')).toBe(mdiThemeLightDark);

		// Dark theme mode.
		await user.click(buttonThemeMode);
		await user.click(screen.getByTestId('menu-theme-mode-3'));
		expect(buttonThemeModeIconPath.getAttribute('d')).toBe(mdiWeatherNight);
	});
});
