// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import { derived } from 'svelte/store';
import i18n from '@sveltekit-i18n/base';
import parser from '@sveltekit-i18n/parser-icu';
import type { Config } from '@sveltekit-i18n/parser-icu';
import lang from './lang.json';

// rtlLocales contains list of locale names to be displayed in rtl direction.
const rtlLocales = ['ar'];

const config: Config = {
	parser: parser(),
	initLocale: 'en',
	fallbackLocale: 'en',
	translations: {
		ar: { lang },
		en: { lang },
		pl: { lang }
	},
	loaders: [
		/* English */
		{
			locale: 'en',
			key: 'common',
			loader: async () => (await import('./en/common.json')).default
		},
		{
			locale: 'en',
			key: 'dashboard',
			routes: [/^(\/){0,1}$/],
			loader: async () => (await import('./en/dashboard.json')).default
		},

		/* Polish */
		{
			locale: 'pl',
			key: 'common',
			loader: async () => (await import('./pl/common.json')).default
		},
		{
			locale: 'pl',
			key: 'dashboard',
			routes: [/^(\/){0,1}$/],
			loader: async () => (await import('./pl/dashboard.json')).default
		}
	]
};

export const { t, locale, locales, loading, loadTranslations, translations } = new i18n(config);

// dir specifies ltr/rtl direction of current locale.
export const dir = derived(locale, ($locale) => (rtlLocales.includes($locale) ? 'rtl' : 'ltr'));
