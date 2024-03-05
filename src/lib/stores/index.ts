// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import { writable } from 'svelte/store';
import type { Settings } from '$lib/common';

// progressOpen is true when top progress bar is enabled.
export const progressOpen = writable<boolean>(false);

// smallWindow is true if application window is small and
// layout for small screens should be used and false otherwise.
// On initialization undefined is set to delay rendering
// page until window object is available to detect resolution.
export const smallWindow = writable<boolean | undefined>(undefined);

// settingsInitialized is true when application settings has been initialized.
export const settingsInitialized = writable<boolean>(false);

// settings is application settings.
export const settings = writable<Settings>({
	themeMode: '', // System theme mode by default.
	locale: '' // Browser locale by default.
});

// unsavedDataExists is true when unsave data is present on page (used
// for page leaving confirmation generation).
export const unsavedDataExists = writable<boolean>(false);

// pageLeft is true when page was left from last time it was reset to false; when
// undefined, page leaving confirmation dialog is still displayed.
export const pageLeft = writable<boolean | undefined>(false);

// snackbarMessage is message to be displayed in snackbar.
export const snackbarMessage = writable<string | undefined>(undefined);
