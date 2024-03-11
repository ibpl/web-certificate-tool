<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { getAlgorithmParameters, getCrypto } from 'pkijs';
	import Button, { Label } from '@smui/button';
	import {
		publicKeyIdentifier,
		downloadPKCS8,
		type Callback,
		OWNER_ID_MAX_LENGTH
	} from '$lib/common';
	import { progressOpen, snackbarMessage } from '$lib/stores';
	import { t } from '$lib/i18n';
	import Paper, { Title, Content } from '@smui/paper';
	import Password from '$lib/components/common/Password.svelte';
	import Textfield from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import ConfirmationDialog from '$lib/components/common/ConfirmationDialog.svelte';

	// ownerId is key owner's ID.
	export let ownerId = '';

	// password is key pair encryption password.
	export let password = '';

	// keyPair is crypto key pair.
	// eslint-disable-next-line no-undef
	export let keyPair: CryptoKeyPair | undefined;

	// KEY_SIZE is key size.
	const KEY_SIZE = 2048;

	// publicKeySha1 is public key SHA-1 identifier.
	let publicKeySha1 = '';

	// publicKeySha256 is public key SHA-256 identifier.
	let publicKeySha256 = '';

	// plainConfirmationDialogOpen is plain key download confirmation dialog.
	let plainConfirmationDialogOpen = false;

	// plainConfirmationDialogCallback is function to be called after plain key download is confirmed.
	let plainConfirmationDialogCallback: Callback;

	// Get crypto engine.
	const crypto = getCrypto(true);

	// updatePublicKeyIdentifiers updates public key identifiers on keypair change.
	// eslint-disable-next-line no-undef
	async function updatePublicKeyIdentifiers(kp: CryptoKeyPair | undefined) {
		if (!kp) {
			publicKeySha1 = '';
			publicKeySha256 = '';
		} else {
			// Calculate new public key identifiers.
			publicKeySha1 = await publicKeyIdentifier(kp.publicKey, 'SHA-1');
			publicKeySha256 = await publicKeyIdentifier(kp.publicKey, 'SHA-256');
		}
	}
	$: updatePublicKeyIdentifiers(keyPair);

	// generateKey generaters new crypto key pair.
	async function generateKey() {
		$progressOpen = true;
		$snackbarMessage = undefined;

		// Generate new RSA key pair.
		const algorithmParameters = getAlgorithmParameters('RSASSA-PKCS1-v1_5', 'generateKey');
		// eslint-disable-next-line no-undef
		const rsaAlgorithmParameters = <RsaHashedKeyGenParams>algorithmParameters.algorithm;
		rsaAlgorithmParameters.modulusLength = KEY_SIZE;

		let newKeyPair = await crypto.subtle.generateKey(
			rsaAlgorithmParameters,
			true,
			algorithmParameters.usages
		);

		// Download new key in PEM formatted PKCS #8 file.
		let newPublicKeySha256 = await publicKeyIdentifier(newKeyPair.publicKey, 'SHA-256');
		downloadPKCS8(
			newKeyPair,
			password,
			ownerId + '_' + newPublicKeySha256.replaceAll(':', '').substring(0, 10) + '.key'
		);

		// Update key pair with new key pair.
		keyPair = newKeyPair;

		$progressOpen = false;
		$snackbarMessage = $t('dashboard.keyGeneratedSuccessfully');
	}

	// downloadKey downloads current crypto key pair.
	async function downloadKey() {
		// Just return if no key pair is present.
		if (!keyPair) {
			return;
		}

		$progressOpen = true;

		// Download new key in PEM formatted PKCS #8 file.
		let publicKeySha256 = await publicKeyIdentifier(keyPair.publicKey, 'SHA-256');
		downloadPKCS8(
			keyPair,
			password,
			ownerId + '_' + publicKeySha256.replaceAll(':', '').substring(0, 10) + '.key'
		);

		$progressOpen = false;
	}
</script>

<!-- /* v8 ignore start */ -->
<Paper style="margin-bottom: 1rem;">
	<Title>{$t('dashboard.key')}</Title>
	<Content>
		<LayoutGrid>
			{#if keyPair}
				<Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
					{$t('dashboard.type')}: <strong>RSA-{KEY_SIZE}</strong><br />
					{$t('dashboard.keyIdentifier', { type: 'SHA1' })}:
					<strong style="overflow-wrap: break-word;">{publicKeySha1}</strong><br />
					{$t('dashboard.keyIdentifier', { type: 'SHA256' })}:
					<strong style="overflow-wrap: break-word;">{publicKeySha256}</strong>
				</Cell>
			{/if}
			<Cell spanDevices={{ desktop: 6, tablet: 4, phone: 4 }}>
				<Textfield
					bind:value={ownerId}
					label={$t('dashboard.ownerId')}
					variant="filled"
					style="width: 100%;"
					helperLine$style="width: 100%"
					input$maxlength={OWNER_ID_MAX_LENGTH}
					input$data-testid="input-ownerid"
					><HelperText slot="helper">{$t('dashboard.keyOwnersId')}</HelperText></Textfield
				>
			</Cell>
			<Cell spanDevices={{ desktop: 6, tablet: 4, phone: 4 }}>
				<Password
					bind:password
					maxLength={1024}
					helperText={$t('dashboard.passwordForKeyEncryptionInFiles')}
				/>
			</Cell>
			<Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
				{#if keyPair}
					<!-- "pointer-events: auto;" required for tooltip over disabled button to work. -->
					<Button
						data-testid="button-download-key"
						on:click={() => {
							if (!password) {
								plainConfirmationDialogCallback = downloadKey;
								plainConfirmationDialogOpen = true;
							} else {
								downloadKey();
							}
						}}
						variant="outlined"
						disabled={ownerId == ''}
						title={ownerId == '' ? $t('dashboard.ownerIdFieldCannotBeEmpty') : undefined}
						style="pointer-events: auto;"
					>
						<Label>{$t('dashboard.downloadKey')}</Label>
					</Button>
				{/if}
				<!-- "pointer-events: auto;" required for tooltip over disabled button to work. -->
				<Button
					on:click={() => {
						if (!password) {
							plainConfirmationDialogCallback = generateKey;
							plainConfirmationDialogOpen = true;
						} else {
							generateKey();
						}
					}}
					variant={keyPair ? 'outlined' : 'raised'}
					disabled={ownerId == ''}
					title={ownerId == '' ? $t('dashboard.ownerIdFieldCannotBeEmpty') : undefined}
					style="pointer-events: auto;"
				>
					<Label>{$t('dashboard.generateAndDownloadNewKey')}</Label>
				</Button>
			</Cell>
		</LayoutGrid>
	</Content>
</Paper>

<!-- Plain key download confirmation dialog. -->
<ConfirmationDialog
	bind:open={plainConfirmationDialogOpen}
	title={$t('dashboard.plainKeyConfirmation')}
	content={$t('dashboard.plainKeyConfirmationContent')}
	on:confirm={() => {
		plainConfirmationDialogCallback();
	}}
/>
