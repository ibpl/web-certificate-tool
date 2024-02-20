// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import InformationSnackbar from './InformationSnackbar.svelte';
import { render, screen } from '@testing-library/svelte';
import { snackbarMessage } from '$lib/stores';

describe('InformationSnackbar', () => {
	// Render the InformationSnackbar component and check if operation succeeded.
	test('rendering', async () => {
		snackbarMessage.set('snack123');
		render(InformationSnackbar);
		expect(screen.getByText('snack123')).toBeTruthy();
	});
});
