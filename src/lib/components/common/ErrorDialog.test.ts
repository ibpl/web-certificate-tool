// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import ErrorDialog from './ErrorDialog.svelte';
import { render, screen } from '@testing-library/svelte';

describe('ErrorDialog', () => {
	test('rendering', () => {
		render(ErrorDialog);
		expect(screen.getByText('Error')).toBeTruthy();
	});
});
