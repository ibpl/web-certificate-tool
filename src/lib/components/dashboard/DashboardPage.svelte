<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import Page from '$lib/components/common/Page.svelte';
	import { t } from '$lib/i18n';
	import Paper, { Content } from '@smui/paper';
</script>

<Page>
	<h6>{$t('common.webCertificateTool')}</h6>
	<Paper square variant="unelevated" class="mdc-theme--secondary" style="text-align: right">
		<Content>
			<small
				><!-- eslint-disable-line svelte/no-at-html-tags -->{@html $t('dashboard.licenseInfo', {
					url: 'https://github.com/ibpl/web-certificate-tool'
				})}</small
			></Content
		>
	</Paper>
</Page>
