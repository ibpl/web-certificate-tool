<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import Hint from '$lib/components/common/Hint.svelte';
	import Page from '$lib/components/common/Page.svelte';
	import Key from '$lib/components/dashboard/Key.svelte';
	import CertificateSigningRequest from '$lib/components/dashboard/CertificateSigningRequest.svelte';
	import Certificate from '$lib/components/dashboard/Certificate.svelte';
	import { progressOpen, settings } from '$lib/stores';
	import { t } from '$lib/i18n';
	import { mdiAlertOutline } from '@mdi/js';

	// ownerId is key owner's ID.
	let ownerId = $settings.ownerId;

	// password is crypto key pair encryption password.
	let password = '';

	// keyPair is crypto key pair.
	// eslint-disable-next-line no-undef
	let keyPair: CryptoKeyPair | undefined = undefined;
</script>

<Page contentEnabled={!$progressOpen}>
	<Key bind:ownerId bind:keyPair bind:password />
	<CertificateSigningRequest bind:ownerId bind:keyPair />
	<Certificate bind:ownerId bind:keyPair bind:password />

	<!-- /* v8 ignore next */ -->
	{#if keyPair}
		<Hint icon={mdiAlertOutline}
			><div slot="content">
				{$t('common.closePageWhenFinished')}
			</div></Hint
		>
	{/if}
</Page>
