<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import Button, { Label } from '@smui/button';
	import { Icon } from '@smui/common';
	import { mdiUpload, mdiFileMoveOutline } from '@mdi/js';
	import { progressOpen, snackbarMessage, errorDialogMessage } from '$lib/stores';
	import { t } from '$lib/i18n';
	import Paper, { Title, Content } from '@smui/paper';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import Textfield from '@smui/textfield';
	import HelperText from '@smui/textfield/helper-text';
	import {
		readFileAsText,
		fromPEM,
		bufferToHex,
		downloadPKCS12,
		getKeyIdentifier,
		CERTIFICATE_PEM_REGEXP,
		PRINTABLE_ASCII_CHARACTERS_REGEXP
	} from '$lib/common';
	import { getCrypto, Certificate, PublicKeyInfo } from 'pkijs';
	import { fromBER } from 'asn1js';
	import moment from 'moment';

	// ownerId is key owner's ID.
	export let ownerId = '';

	// keyPair is crypto key pair.
	// eslint-disable-next-line no-undef
	export let keyPair: CryptoKeyPair | undefined;

	// password is key pair encryption password.
	export let password = '';

	// certificate is parsed and validated certificate.
	let certificate: Certificate | undefined = undefined;

	// crtPem is certificate in PEM format.
	let crtPem = '';

	// crtErrorMessage is certificate validation error message.
	let crtErrorMessage = '';

	// crtInvalidBefore is certificate validy period start.
	let crtInvalidBefore = '';

	// crtInvalidAfter is certificate validy period end.
	let crtInvalidAfter = '';

	// crtSerialNumber is certificate serial number.
	let crtSerialNumber = '';

	// Get crypto engine.
	const crypto = getCrypto(true);

	// updateCrt parses and validates certificate.
	// eslint-disable-next-line no-undef, @typescript-eslint/no-unused-vars
	async function updateCrt(kp: CryptoKeyPair | undefined, ownerId: string, crtPem: string) {
		crtErrorMessage = '';
		certificate = undefined;
		crtInvalidBefore = '';
		crtInvalidAfter = '';
		crtSerialNumber = '';

		if (crtPem != '') {
			try {
				if (!CERTIFICATE_PEM_REGEXP.test(crtPem)) {
					throw new Error();
				}
				certificate = Certificate.fromBER(fromPEM(crtPem));
				crtInvalidBefore =
					moment(certificate.notBefore.value).utc().format('YYYY-MM-DD HH:mm:ss') + ' UTC';
				crtInvalidAfter =
					moment(certificate.notAfter.value).utc().format('YYYY-MM-DD HH:mm:ss') + ' UTC';
				crtSerialNumber = bufferToHex(certificate.serialNumber.valueBlock.valueHexView);

				// Certificate cannot be expired.
				if (new Date() > certificate.notAfter.value) {
					certificate = undefined;
					crtErrorMessage = t.get('dashboard.expiredCertificate') + '.';
					return;
				}

				// Certificate's subject common name must be equal to owner's ID.
				if (ownerId) {
					let cn = '';
					for (let i = 0; i < certificate.subject.typesAndValues.length; i++) {
						if (certificate.subject.typesAndValues[i].type == '2.5.4.3') {
							// 2.5.4.3 is CN
							cn = certificate.subject.typesAndValues[i].value.valueBlock.value;
							break;
						}
					}
					if (cn != ownerId) {
						certificate = undefined;
						crtErrorMessage = t.get('dashboard.crtDoesNotMatchOwnerId') + '.';
						return;
					}
				}

				// Certificate's subject public key must match key pair.
				if (keyPair) {
					try {
						const publicKeyBinary = await crypto.exportKey('spki', keyPair.publicKey);
						const publicKeyInfo = new PublicKeyInfo({ schema: fromBER(publicKeyBinary).result });
						if (
							!certificate.subjectPublicKeyInfo.subjectPublicKey.isEqual(
								publicKeyInfo.subjectPublicKey
							)
						) {
							certificate = undefined;
							crtErrorMessage = t.get('dashboard.crtDoesNotMatchKey') + '.';
							return;
						}
						// eslint-disable-next-line no-empty
					} catch (e) {}
				}
			} catch (e) {
				crtErrorMessage = t.get('dashboard.invalidCertificate') + '.';
			}
		}
	}
	$: updateCrt(keyPair, ownerId, crtPem);

	// crtFileInput is hidden file input used for picking certificate file to load.
	let crtFileInput: HTMLInputElement;

	// loadKey loads certificate from file picked with crtFileInput.
	async function loadCrt() {
		// Require one key file to be selected.
		if (!crtFileInput.files || crtFileInput.files.length != 1) {
			return;
		}
		$progressOpen = true;
		$snackbarMessage = undefined;

		try {
			crtPem = await readFileAsText(crtFileInput.files[0]);
			$progressOpen = false;
			$snackbarMessage = $t('dashboard.crtLoadedSuccessfully');
		} catch (e) {
			$progressOpen = false;
			$errorDialogMessage =
				(e instanceof Error ? e.message + '. ' : '') +
				t.get('dashboard.errorLoadingCrtFromFile') +
				'.';
		}
		// Reset file input value to workaround problems with uploading same file again in some browsers.
		// See https://stackoverflow.com/questions/4109276/how-to-detect-input-type-file-change-for-the-same-file
		if (crtFileInput && crtFileInput.value) {
			crtFileInput.value = '';
		}
	}

	// generatePKCS12 generates PKCS #12 archive with private key and certificate and download it.
	async function generatePKCS12() {
		// Just return if no key pair is present.
		if (!ownerId || !keyPair || !certificate) {
			return;
		}

		$progressOpen = true;
		$snackbarMessage = undefined;

		try {
			const keyIdentifierSha256 = await getKeyIdentifier(keyPair, 'SHA-256');

			$snackbarMessage = t.get('dashboard.pleaseWaitFewMinutes');

			await downloadPKCS12(
				keyPair,
				certificate,
				ownerId,
				password,
				ownerId.substring(0, 50) +
					'_' +
					keyIdentifierSha256.replaceAll(':', '').substring(0, 10) +
					'_' +
					crtSerialNumber.replaceAll(':', '').substring(0, 10) +
					'.p12'
			);
			$progressOpen = false;
			$snackbarMessage = undefined;
		} catch (e) {
			$progressOpen = false;
			$snackbarMessage = undefined;
			$errorDialogMessage =
				(e instanceof Error ? e.message + '. ' : '') + t.get('dashboard.errorGeneratingP12') + '.';
		}
	}
</script>

<!-- /* v8 ignore start */ -->
<Paper variant="outlined" style="margin-bottom: 1rem;">
	<Title>{$t('dashboard.certificate')}</Title>
	<Content>
		<LayoutGrid>
			{#if crtSerialNumber || crtInvalidBefore || crtInvalidAfter}
				<Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
					{#if crtInvalidBefore}
						{$t('dashboard.invalidBefore')}:
						<strong data-testid="strong-crt-invalid-before">{crtInvalidBefore}</strong><br />
					{/if}
					{#if crtInvalidAfter}
						{$t('dashboard.invalidAfter')}:
						<strong data-testid="strong-crt-invalid-after">{crtInvalidAfter}</strong><br />
					{/if}
					{#if crtSerialNumber}
						{$t('dashboard.serialNumber')}:
						<strong style="overflow-wrap: break-word;" data-testid="strong-crt-serial-number"
							>{crtSerialNumber}</strong
						><br />
					{/if}
				</Cell>
			{/if}
			<Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
				<!-- Textarea with CSR content and size auto-adjusting. -->
				<Textfield
					textarea
					input$rows={10}
					bind:value={crtPem}
					input$class={'code'}
					input$spellcheck={false}
					input$style="white-space: pre; overflow: auto; pointer-events: auto;"
					input$data-testid="input-crt"
					invalid={crtErrorMessage != ''}
					updateInvalid={false}
					style="width: 100%; max-width: 680px;"
					helperLine$style="width: 100%; max-width: 680px;"
				>
					<svelte:fragment slot="helper">
						<HelperText persistent={!certificate} validationMsg={false}
							>{$t('dashboard.pasteOrLoadCrt')}</HelperText
						>
						<HelperText validationMsg={true} data-testid="input-crt-validation-msg"
							>{crtErrorMessage}</HelperText
						>
					</svelte:fragment>
				</Textfield>
			</Cell>
			<Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
				<!-- Hidden file input will pick file and call when called with file load button below. -->
				<input
					data-testid="input-load-crt"
					bind:this={crtFileInput}
					type="file"
					accept=".crt,.pem"
					on:change={loadCrt}
					style="display: none;"
				/>
				<!-- "pointer-events: auto;" required for tooltip over disabled button to work. -->
				<Button
					data-testid="button-load-crt"
					on:click={() => crtFileInput.click()}
					variant="outlined"
					style="pointer-events: auto;"
				>
					<Icon tag="svg" viewBox="0 0 24 24">
						<path d={mdiUpload} />
					</Icon>
					<Label>{$t('dashboard.loadCrtFromFile')}</Label>
				</Button>
				<!-- "pointer-events: auto;" required for tooltip over disabled button to work. -->
				<Button
					data-testid="button-generate-and-download-p12"
					on:click={async () => {
						generatePKCS12();
					}}
					variant="outlined"
					disabled={!ownerId ||
						!password ||
						!PRINTABLE_ASCII_CHARACTERS_REGEXP.test(password) ||
						!keyPair ||
						!certificate}
					title={!ownerId
						? $t('dashboard.ownerIdFieldCannotBeEmpty')
						: !password
						? $t('dashboard.passwordFieldCannotBeEmpty')
						: !PRINTABLE_ASCII_CHARACTERS_REGEXP.test(password)
						? $t('dashboard.passwordMayContainASCIIPrintableCharactersOnly')
						: !keyPair
						? $t('dashboard.keyMustBeAvailable')
						: !certificate
						? $t('dashboard.validCertificateMustBeAvailable')
						: undefined}
					style="pointer-events: auto;"
				>
					<Icon tag="svg" viewBox="0 0 24 24">
						<path d={mdiFileMoveOutline} />
					</Icon>
					<Label>{$t('dashboard.downloadP12')}</Label>
				</Button>
			</Cell>
		</LayoutGrid>
	</Content>
</Paper>
