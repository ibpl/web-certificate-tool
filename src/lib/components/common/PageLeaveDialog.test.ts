// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import PageLeaveDialog from './PageLeaveDialog.svelte';
import { render, screen } from '@testing-library/svelte';

describe('PageLeaveDialog', () => {
	// Render the PageLeaveDialog component and check if operation succeeded.
	test('rendering', () => {
		render(PageLeaveDialog);
		expect(screen.getByText('Confirm Page Leaving')).toBeTruthy();
	});
});
