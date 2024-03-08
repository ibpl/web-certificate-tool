// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import DashboardPage from './DashboardPage.svelte';
import { render, screen } from '@testing-library/svelte';
import { progressOpen } from '$lib/stores';

describe('DashboardPage', () => {
	test('rendering works', () => {
		render(DashboardPage);
		const dashboardPageHeader = screen.getByText((content, element) => {
			return element?.tagName.toLowerCase() === 'h6' && content === 'Web Certificate Tool';
		});
		expect(dashboardPageHeader).toBeTruthy();
	});
	test('page content is enabled when progress is closed', async () => {
		const { container } = render(DashboardPage);
		progressOpen.set(false);
		await vi.waitFor(() => {
			const div = container.querySelector('.disabled');
			expect(expect(div).toBeFalsy());
		});
	});
	test('page content is disabled when progress is open', async () => {
		const { container } = render(DashboardPage);
		progressOpen.set(true);
		await vi.waitFor(() => {
			const div = container.querySelector('.disabled');
			expect(expect(div).toBeTruthy());
		});
	});
});
