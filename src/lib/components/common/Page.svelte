<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { t } from '$lib/i18n';
	import ErrorBanner from '$lib/components/common/ErrorBanner.svelte';

	// title is string displayed in bar.
	export let title = '';

	// contentEnabled allows page content area padding customization.
	export let contentPadding = '0rem 1rem 2rem 1rem';

	// contentEnabled allows disabling access to all controls on page content when set to false.
	export let contentEnabled = true;

	// errorBanner is error message to be displayed in banner.
	export let errorBanner: string | undefined = undefined;
</script>

<svelte:head>
	<title>{title ? title + ' • ' : ''}{$t('common.webCertificateTool')}</title>
</svelte:head>

<ErrorBanner bind:message={errorBanner} />
<div class="page-content{contentEnabled ? '' : ' disabled'}" style="padding: {contentPadding};">
	<slot />
</div>

<style>
	.page-content {
		overflow: auto;
		flex-basis: 0;
		height: 100%;
		flex-grow: 1;
		opacity: 1;
		transition: opacity 0.2s;
	}

	.disabled {
		opacity: 0.5;
		transition: opacity 0.2s;
	}
</style>
