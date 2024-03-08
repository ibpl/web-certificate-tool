// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import Key from './Key.svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { OWNER_ID_MAX_LENGTH } from '$lib/common';

describe('Key', () => {
	test('key generation works', async () => {
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
	});
});
