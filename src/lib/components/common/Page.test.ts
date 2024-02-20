// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import Page from './Page.svelte';
import { render } from '@testing-library/svelte';

describe('Page', () => {
	// Render the Page component and check if it's present.
	test('rendering', async () => {
		const { container } = render(Page, { props: { contentEnabled: true, title: 'title123' } });
		const div = container.querySelector('.disabled');
		expect(div).toBeFalsy();
	});

	// Hide the Page component and check if it's hidden.
	test('hiding', async () => {
		const { container } = render(Page, { props: { contentEnabled: false } });
		const div = container.querySelector('.disabled');
		expect(div).toBeTruthy();
	});
});
