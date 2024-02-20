// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

// isAppError is App.Error type guard.
export function isAppError(arg: unknown): arg is App.Error {
	// Falsy (https://developer.mozilla.org/en-US/docs/Glossary/Falsy)
	// or something not object type is not a App.Error.
	if (!arg || typeof arg !== 'object') {
		return false;
	}

	// status field must exist and be a number.
	if (!('status' in arg) || typeof arg.status !== 'number') {
		return false;
	}

	// message field must exist and be a string.
	if (!('message' in arg) || typeof arg.message !== 'string') {
		return false;
	}

	// All checks passed so we assume it's App.Error.
	return true;
}

// convertToAppError converts any error into App.Error error.
export function convertToAppError(
	e: unknown,
	operation: string | undefined = undefined,
	standardErrorMessage: string | undefined = undefined
): App.Error {
	// Don't alter if already App.Error.
	if (isAppError(e)) {
		// Use given operation if not already set in error.
		if (!e.operation && operation) {
			e.operation = operation;
		}
		return e;
	}

	// Return standard application error if not App.Error.
	// If custom message was provided use it and put original message in details.
	const originalMessage = e instanceof Error ? e.message : (e as string);
	return <App.Error>{
		status: 418, // Use dummy 418 HTTP error code to avoid displaying HTTP error code in UI.
		message: standardErrorMessage ? standardErrorMessage : originalMessage,
		operation: operation,
		details: standardErrorMessage ? originalMessage : undefined
	};
}
