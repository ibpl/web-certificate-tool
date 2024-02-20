// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import ConfirmationDialog from './ConfirmationDialog.svelte';
import { render, screen } from '@testing-library/svelte';

describe('ConfirmationDialog', () => {
	// Render the ConfirmationDialog component and check if operation succeeded.
	test('rendering', () => {
		render(ConfirmationDialog, {
			props: {
				open: true,
				title: 'test123',
				content: 'content123',
				confirmLabel: 'confirm123',
				refuseLabel: 'refuse123'
			}
		});
		expect(screen.getByText('test123')).toBeTruthy();
		expect(screen.getByText('content123')).toBeTruthy();
		expect(screen.getByText('confirm123')).toBeTruthy();
		expect(screen.getByText('refuse123')).toBeTruthy();
	});
});
