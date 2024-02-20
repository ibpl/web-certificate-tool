// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import ProgressBar from './ProgressBar.svelte';
import { render } from '@testing-library/svelte';

describe('ProgressBar', () => {
	// Render the ProgressBar component and check if operation succeeded.
	test('rendering', () => {
		const { container } = render(ProgressBar);
		const div = container.querySelector('.progress-bar');
		expect(div).toBeTruthy();
	});
});
