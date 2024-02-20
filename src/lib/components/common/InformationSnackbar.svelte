<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { t } from '$lib/i18n';
	import Button, { Label } from '@smui/button';
	import Snackbar, { Actions } from '@smui/snackbar';
	import { snackbarMessage } from '$lib/stores';

	let snackbar: Snackbar;
	let message: string;

	// Open snackbar when message to be displayed is set in store.

	// snackbarMessageChangeHandler handles snackbarMessage value changes.
	function snackbarMessageChangeHandler(snackbarMessage: string | undefined) {
		if (snackbarMessage !== undefined) {
			message = snackbarMessage;
			if (snackbar) {
				snackbar.open();
			}
		} else {
			if (snackbar) {
				snackbar.close();
			}
		}
	}
	$: snackbarMessageChangeHandler($snackbarMessage);

	// closeHandler handles snackbar close.
	function closeHandler() {
		// Reset message for snackbar to open on next message set.
		$snackbarMessage = undefined;
	}
</script>

<Snackbar bind:this={snackbar} on:SMUISnackbar:closed={closeHandler}>
	<Label>{message}</Label>
	<Actions>
		<!-- We use text button not SVG close button here because of SVG path
			coloring bug https://github.com/hperrin/svelte-material-ui/issues/565 -->
		<Button on:click={/* v8 ignore next */ () => snackbar.close()}>{$t('common.ok')}</Button>
	</Actions>
</Snackbar>
