// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import type { HandleClientError } from '@sveltejs/kit';

// Unexpected error handler. Should return App.Error object as defined in src/app.d.ts.
// For details see:
// https://kit.svelte.dev/docs/errors#unexpected-errors
// https://kit.svelte.dev/docs/types#app-error
export const handleError = (({ error, event, status, message }) => {
	return {
		details:
			typeof error === 'object' && error !== null && 'details' in error
				? <string>error.details
				: undefined,
		event: event,
		message:
			typeof error === 'object' && error !== null && 'message' in error
				? <string>error.message
				: message,
		operation:
			typeof error === 'object' && error !== null && 'operation' in error
				? <string>error.operation
				: undefined,
		status:
			typeof error === 'object' && error !== null && 'status' in error
				? <number>error.status
				: status,
		url:
			typeof error === 'object' && error !== null && 'url' in error ? <string>error.url : undefined
	};
}) satisfies HandleClientError;
