<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { getAlgorithmParameters, getCrypto } from 'pkijs';
	import Button, { Label } from '@smui/button';
	import {
		getKeyIdentifier,
		downloadPKCS8,
		type Callback,
		OWNER_ID_MAX_LENGTH,
		loadPKCS8,
		getKeyType
	} from '$lib/common';
	import { progressOpen, snackbarMessage, errorDialogMessage } from '$lib/stores';
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

	// keyIdentifierSha1 is public key SHA-1 identifier.
	let keyIdentifierSha1 = '';

	// keyIdentifierSha256 is public key SHA-256 identifier.
	let keyIdentifierSha256 = '';

	// keyType is key type.
	let keyType = '';

	// plainConfirmationDialogOpen is plain key download confirmation dialog.
	let plainConfirmationDialogOpen = false;

	// plainConfirmationDialogCallback is function to be called after plain key download is confirmed.
	let plainConfirmationDialogCallback: Callback;

	// Get crypto engine.
	const crypto = getCrypto(true);

	// updateKeyInformation updates public key identifiers on keypair change.
	// eslint-disable-next-line no-undef
	async function updateKeyInformation(kp: CryptoKeyPair | undefined) {
		if (!kp) {
			keyIdentifierSha1 = '';
			keyIdentifierSha256 = '';
		} else {
			try {
				keyIdentifierSha1 = await getKeyIdentifier(kp, 'SHA-1');
				keyIdentifierSha256 = await getKeyIdentifier(kp, 'SHA-256');
				keyType = await getKeyType(kp);
			} catch (e) {
				keyIdentifierSha1 = '?';
				keyIdentifierSha256 = '?';
				keyType = '?';
				$errorDialogMessage =
					(e instanceof Error ? e.message + '. ' : '') +
					t.get('dashboard.errorReadingKeyInformation') +
					'.';
			}
		}
	}
	$: updateKeyInformation(keyPair);

	// generateKey generaters new crypto key pair.
	async function generateKey() {
		$progressOpen = true;
		$snackbarMessage = undefined;

		try {
			// Generate new RSA key pair.
			const algorithmParameters = getAlgorithmParameters('RSASSA-PKCS1-v1_5', 'generateKey');
			// eslint-disable-next-line no-undef
			const rsaAlgorithmParameters = <RsaHashedKeyGenParams>algorithmParameters.algorithm;
			rsaAlgorithmParameters.modulusLength = KEY_SIZE;

			let newKeyPair = await crypto.generateKey(
				rsaAlgorithmParameters,
				true,
				algorithmParameters.usages
			);

			// Download new key in PEM formatted PKCS #8 file. Generate filename fron oid and first 10 key SHA256 chars.
			let newPublicKeySha256 = await getKeyIdentifier(newKeyPair, 'SHA-256');
			downloadPKCS8(
				newKeyPair,
				password,
				ownerId + '_' + newPublicKeySha256.replaceAll(':', '').substring(0, 10) + '.key'
			);

			// Update key pair with new key pair.
			keyPair = newKeyPair;

			$progressOpen = false;
			$snackbarMessage = $t('dashboard.keyGeneratedSuccessfully');
		} catch (e) {
			$progressOpen = false;
			$errorDialogMessage =
				(e instanceof Error ? e.message + '. ' : '') + t.get('dashboard.errorGeneratingKey') + '.';
		}
	}

	// downloadKey downloads current crypto key pair.
	async function downloadKey() {
		// Just return if no key pair is present.
		if (!keyPair) {
			return;
		}

		$progressOpen = true;
		$snackbarMessage = undefined;

		try {
			// Download new key in PEM formatted PKCS #8 file.
			let keyIdentifierSha256 = await getKeyIdentifier(keyPair, 'SHA-256');

			downloadPKCS8(
				keyPair,
				password,
				ownerId + '_' + keyIdentifierSha256.replaceAll(':', '').substring(0, 10) + '.key'
			);
			$progressOpen = false;
		} catch (e) {
			$progressOpen = false;
			$errorDialogMessage =
				(e instanceof Error ? e.message + '. ' : '') + t.get('dashboard.errorDownloadingKey') + '.';
		}
	}
	// keyFileInput is hidden file input used for picking key file to load.
	let keyFileInput: HTMLInputElement;

	// loadKey loads key from file picked with keyFileInput.
	async function loadKey() {
		// Require one key file to be selected.
		if (!keyFileInput.files || keyFileInput.files.length != 1) {
			return;
		}
		$progressOpen = true;
		$snackbarMessage = undefined;

		try {
			keyPair = await loadPKCS8(keyFileInput.files[0], password);
			$progressOpen = false;
			$snackbarMessage = $t('dashboard.keyLoadedSuccessfully');
		} catch (e) {
			$progressOpen = false;
			$errorDialogMessage =
				/* v8 ignore next */
				(e instanceof Error ? e.message + '. ' : '') +
				t.get('dashboard.errorLoadingKeyFromFile') +
				'.';
		}
	}
</script>

<!-- /* v8 ignore start */ -->
<Paper variant="outlined" style="margin-bottom: 1rem;">
	<Title>{$t('dashboard.key')}</Title>
	<Content>
		<LayoutGrid>
			{#if keyPair}
				<Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
					{$t('dashboard.type')}: <strong data-testid="strong-key-type">{keyType}</strong><br />
					{$t('dashboard.keyIdentifier', { type: 'SHA1' })}:
					<strong data-testid="strong-key-sha1" style="overflow-wrap: break-word;"
						>{keyIdentifierSha1}</strong
					>
					<br />
					{$t('dashboard.keyIdentifier', { type: 'SHA256' })}:
					<strong data-testid="strong-key-sha256" style="overflow-wrap: break-word;"
						>{keyIdentifierSha256}</strong
					>
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
					data-testid="button-generate-and-download-key"
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
				<!-- Hidden file input will pick file and call when called with file load button below. -->
				<input
					data-testid="input-load-key"
					bind:this={keyFileInput}
					type="file"
					accept=".key"
					on:change={loadKey}
					style="display: none;"
				/>
				<!-- "pointer-events: auto;" required for tooltip over disabled button to work. -->
				<Button
					data-testid="button-load-key"
					on:click={() => keyFileInput.click()}
					variant={keyPair ? 'outlined' : 'raised'}
					disabled={ownerId == ''}
					title={ownerId == '' ? $t('dashboard.ownerIdFieldCannotBeEmpty') : undefined}
					style="pointer-events: auto;"
				>
					<Label>{$t('dashboard.loadExistingKeyFromFile')}</Label>
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
