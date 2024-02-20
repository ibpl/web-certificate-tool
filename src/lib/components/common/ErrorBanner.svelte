<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { t } from '$lib/i18n';
	import Button from '@smui/button';
	import Banner, { Label, Icon, CloseReason } from '@smui/banner';
	import { mdiAlertCircle } from '@mdi/js';

	export let message: string | undefined = undefined; // message is error message displayed in error banner.

	let banner: Banner; // banner is error banner handle.
	let open = false; // open is banner opening status.
	let content: string | undefined = undefined; // content is content displayed in banners.

	// messageChangeHandler updates banner state on message changes.
	function messageChangeHandler(message: string | undefined) {
		if (message !== undefined) {
			content = message;
			if (!open) {
				open = true;
			}
			// https://github.com/hperrin/svelte-material-ui/issues/577 workaround.
			setTimeout(() => {
				banner.layout();
			}, 0);
		} else {
			if (open) {
				open = false;
			}
		}
	}
	$: messageChangeHandler(message);

	// closeHandler handles error banner close.
	function closeHandler(event: CustomEvent<{ reason: CloseReason }>) {
		switch (event.detail.reason) {
			case CloseReason.PRIMARY:
				message = undefined;
				break;
		}
	}
</script>

<Banner
	bind:this={banner}
	bind:open
	mobileStacked={true}
	on:SMUIBanner:closed={closeHandler}
	on:SMUIBanner:opened={() => {
		// https://github.com/hperrin/svelte-material-ui/issues/577 workaround.
		banner.layout();
	}}
>
	<Icon slot="icon" tag="svg" viewBox="0 0 24 24">
		<path fill="currentColor" d={mdiAlertCircle} />
	</Icon>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<Label slot="label">{@html content}</Label>
	<svelte:fragment slot="actions">
		<Button>{$t('common.ok')}</Button>
	</svelte:fragment>
</Banner>
