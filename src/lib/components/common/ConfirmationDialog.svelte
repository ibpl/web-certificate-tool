<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { t } from '$lib/i18n';
	import Dialog, { Title, Content, Actions, InitialFocus } from '@smui/dialog';
	import Button, { Label } from '@smui/button';
	import { createEventDispatcher } from 'svelte';

	export let open: boolean; // open allows to open (when true) or close (when false) confirmation dialog.
	export let title: string; // title is string displayed in bar (cannot contain leading whitespace due to mdc-typography-baseline-top()).
	export let content: string; // content is content displayed in confirmation dialog.
	export let confirmLabel = ''; // confirmLabel is text displayed on confirm button.
	export let refuseLabel = ''; // refuseLabel is text displayed on refuse button.

	const dispatch = createEventDispatcher();
</script>

<Dialog
	bind:open
	aria-labelledby="confirmation-dialog-title"
	aria-describedby="confirmation-dialog-content"
>
	<Title id="confirmation-dialog-title">{title}</Title>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<Content id="confirmation-dialog-content">{content}</Content>
	<Actions>
		<Button on:click={() => dispatch('confirm')} data-testid="button-confirmation-yes">
			<Label>{confirmLabel ? confirmLabel : $t('common.yes')}</Label>
		</Button>
		<Button
			on:click={() => dispatch('refuse')}
			defaultAction
			use={[InitialFocus]}
			data-testid="button-confirmation-no"
		>
			<Label>{refuseLabel ? refuseLabel : $t('common.no')}</Label>
		</Button>
	</Actions>
</Dialog>
