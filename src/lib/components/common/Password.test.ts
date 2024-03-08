// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import Password from './Password.svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { mdiEye, mdiEyeOff } from '@mdi/js';

describe('Password', () => {
	test('password visibility changing works', async () => {
		const user = userEvent.setup();
		render(Password, { props: { password: 'test' } });
		const inputPassword = screen.getByTestId('input-password');
		const buttonPasswordVisibilityIconPath = screen.getByTestId(
			'button-password-visibility-icon-path'
		);

		// Password should be hidden by default with appropriate icon displayed.
		expect(inputPassword.getAttribute('type')).toBe('password');
		expect(inputPassword.getAttribute('maxlength')).toBe(null);
		await vi.waitFor(() =>
			expect(buttonPasswordVisibilityIconPath.getAttribute('d')).toBe(mdiEyeOff)
		);

		// Toggle password visibility using button.
		await user.click(screen.getByTestId('button-password-visibility'));

		// Check if password is visible and appropriate icon is displayed.
		expect(inputPassword.getAttribute('type')).toBe('text');
		await vi.waitFor(() => expect(buttonPasswordVisibilityIconPath.getAttribute('d')).toBe(mdiEye));
	});

	test('password length limit works', () => {
		render(Password, { props: { maxLength: 10 } });
		const inputPassword = screen.getByTestId('input-password');
		expect(inputPassword.getAttribute('maxlength')).toBe('10');
	});
});
