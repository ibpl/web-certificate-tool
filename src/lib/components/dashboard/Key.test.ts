// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import Key from './Key.svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { OWNER_ID_MAX_LENGTH } from '$lib/common';
import FileSaver from 'file-saver';

describe('Key', () => {
	test('unencrypted key generation works', async () => {
		const user = userEvent.setup();
		render(Key, { props: { ownerId: '', password: '', keyPair: undefined } });
		const inputOwnerId = screen.getByTestId('input-ownerid');

		// Generate key button should be raised and disabled when owner's ID field is empty,
		// with tooltip that explains disabling reason.
		const buttonGenerateKey = screen.getByTitle('Owner ID field cannot be empty.');
		expect(buttonGenerateKey.getAttribute('class')).toBe('mdc-button mdc-button--raised');
		expect(buttonGenerateKey.getAttribute('disabled')).toBe('');

		// Type owner's ID (max allowed length) and check whether key generation button is enabled.
		await user.type(inputOwnerId, 'a'.repeat(OWNER_ID_MAX_LENGTH));
		expect(buttonGenerateKey.getAttribute('disabled')).toBe(null);

		// Click generate button key, cancel abort operation in encryption dialog.
		const spy = vi.spyOn(FileSaver, 'saveAs');
		global.URL.createObjectURL = vi.fn();
		await user.click(buttonGenerateKey);
		await user.click(screen.getByTestId('button-confirmation-no'));
		await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(0), { timeout: 3000 });

		// Click generate button key, confirm no encryption and generate new key.
		await user.click(buttonGenerateKey);
		await user.click(screen.getByTestId('button-confirmation-yes'));
		await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1), { timeout: 3000 });
		await vi.waitFor(() => expect(screen.queryByText(/SHA1 identifier/i)).toBeTruthy());
		await vi.waitFor(() => expect(screen.queryByText(/SHA256 identifier/i)).toBeTruthy());
	}, 20000);

	test('encrypted key generation works', async () => {
		const user = userEvent.setup();
		render(Key, { props: { ownerId: '', password: '', keyPair: undefined } });
		const inputOwnerId = screen.getByTestId('input-ownerid');
		const inputPassword = screen.getByTestId('input-password');

		// Generate key button should be raised and disabled when owner's ID field is empty,
		// with tooltip that explains disabling reason.
		const buttonGenerateKey = screen.getByTitle('Owner ID field cannot be empty.');
		expect(buttonGenerateKey.getAttribute('class')).toBe('mdc-button mdc-button--raised');
		expect(buttonGenerateKey.getAttribute('disabled')).toBe('');

		// Type owner's ID (max allowed length) and check whether key generation button is enabled.
		await user.type(inputOwnerId, 'a'.repeat(OWNER_ID_MAX_LENGTH));
		expect(buttonGenerateKey.getAttribute('disabled')).toBe(null);

		// Provide password and click key generate button to generate new key.
		await user.type(inputPassword, 'b'.repeat(30));
		const spy = vi.spyOn(FileSaver, 'saveAs');
		global.URL.createObjectURL = vi.fn();
		await user.click(buttonGenerateKey);
		await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1), { timeout: 3000 });
		await vi.waitFor(() => expect(screen.queryByText(/SHA1 identifier/i)).toBeTruthy());
		await vi.waitFor(() => expect(screen.queryByText(/SHA256 identifier/i)).toBeTruthy());

		// Click key download button to download existing key.
		await user.click(screen.getByTestId('button-download-key'));
		await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
	}, 20000);
});
