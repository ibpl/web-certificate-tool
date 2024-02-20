// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

declare global {
	namespace App {
		interface Error {
			details?: string;
			event?: NavigationEvent;
			message: string;
			operation?: string;
			status?: number;
			url?: string;
		}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
