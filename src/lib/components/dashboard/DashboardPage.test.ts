// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import DashboardPage from './DashboardPage.svelte';
import { render, screen } from '@testing-library/svelte';

describe('DashboardPage', () => {
	// Render the DashboardPage component and check if its header is present.
	test('rendering', async () => {
		render(DashboardPage);
		const dashboardPageHeader = screen.getByText((content, element) => {
			return element?.tagName.toLowerCase() === 'h6' && content === 'Web Certificate Tool';
		});
		expect(dashboardPageHeader).toBeTruthy();
	});
});
