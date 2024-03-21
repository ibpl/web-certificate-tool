<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { t } from '$lib/i18n';
	import Button, { Label } from '@smui/button';
	import Dialog, { Title, Content, Actions, InitialFocus } from '@smui/dialog';
	import { errorDialogMessage } from '$lib/stores';

	let open: boolean;
	let message: string;

	// Open error dialog when erro message to be displayed is set in store.

	// errorDialogMessageChangeHandler handles errorDialogMessage value changes.
	function errorDialogMessageChangeHandler(errorDialogMessage: string | undefined) {
		if (errorDialogMessage !== undefined) {
			message = errorDialogMessage;
			open = true;
		} else {
			open = false;
		}
	}
	$: errorDialogMessageChangeHandler($errorDialogMessage);

	// closeHandler handles dialog close.
	function closeHandler() {
		// Reset error message for dialog to open on next error message set.
		$errorDialogMessage = undefined;
	}
</script>

<Dialog
	bind:open
	on:SMUIDialog:closed={closeHandler}
	aria-labelledby="error-dialog-title"
	aria-describedby="error-dialog-content"
>
	<Title id="error-dialog-title">{$t('common.error')}</Title>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<Content id="error-dialog-content">{@html message}</Content>
	<Actions>
		<Button action="close" defaultAction use={[InitialFocus]}>
			<Label>{$t('common.ok')}</Label>
		</Button>
	</Actions>
</Dialog>
