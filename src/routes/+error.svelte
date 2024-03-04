<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import Page from '$lib/components/common/Page.svelte';
	import { t } from '$lib/i18n';
	import { page } from '$app/stores';
</script>

{#if $page.status === 404}
	<Page title={$t('common.error') + ' 404'}>
		<h6>{$t('common.pageNotFound')}</h6>
	</Page>
{:else}
	<Page
		title={$t('common.error') +
			($page?.error?.status !== 418
				? ' ' + ($page?.error?.status ? $page.error.status : $page.status)
				: '')}
	>
		<h6>
			{$page?.error?.message ? $page.error.message : $t('common.unknownError')}
		</h6>
		<p>
			{#if $page?.error?.operation}{$t('common.operation')}: {$page.error.operation}<br />{/if}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{#if $page?.error?.details}{$t('common.details')}: {@html $page.error.details}<br />{/if}
			{#if $page?.error?.url}{$t('common.url')}: {$page.error.url}<br />{/if}
		</p>
	</Page>
{/if}
