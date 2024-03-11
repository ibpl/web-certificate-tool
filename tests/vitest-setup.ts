// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import '@testing-library/svelte/vitest';
import '@testing-library/jest-dom/vitest';
import { setupServer } from 'msw/node';
import { Crypto } from '@peculiar/webcrypto';

// Enable Web Crypto for tests.
const cryptoModule = new Crypto();
Object.defineProperty(window, 'crypto', {
	get() {
		return cryptoModule;
	}
});

// Request handling with MST; see https://vitest.dev/guide/mocking.html#requests
export const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' })); // Start server before all tests.
afterAll(() => server.close()); //  Close server after all tests.
afterEach(() => server.resetHandlers()); // Reset handlers after each test `important for test isolation`.
