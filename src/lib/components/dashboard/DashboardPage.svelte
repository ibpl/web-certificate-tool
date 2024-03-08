<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import Page from '$lib/components/common/Page.svelte';
	import Key from '$lib/components/dashboard/Key.svelte';
	import { progressOpen, settings } from '$lib/stores';

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
</Page>
