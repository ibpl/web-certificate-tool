<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

<script lang="ts">
	import { AttributeTypeAndValue, CertificationRequest } from 'pkijs';
	import { Utf8String } from 'asn1js';
	import Button, { Label } from '@smui/button';
	import { progressOpen, snackbarMessage, errorDialogMessage } from '$lib/stores';
	import { t } from '$lib/i18n';
	import Paper, { Title, Content } from '@smui/paper';
	import LayoutGrid, { Cell } from '@smui/layout-grid';
	import Textfield from '@smui/textfield';
	import { toPEM, getKeyIdentifier, downloadPKCS10 } from '$lib/common';
	import { copy } from 'svelte-copy';

	// ownerId is key owner's ID.
	export let ownerId = '';

	// keyPair is crypto key pair.
	// eslint-disable-next-line no-undef
	export let keyPair: CryptoKeyPair | undefined;

	// csr is certificate signing request.
	export let csrPem = '';

	// updateCsr removes previous CSR on key pair or owner's ID change.
	// eslint-disable-next-line no-undef, @typescript-eslint/no-unused-vars
	async function updateCsr(kp: CryptoKeyPair | undefined, ownerId: string) {
		csrPem = '';
	}
	$: updateCsr(keyPair, ownerId);

	// generateCsr generates new CSR.
	async function generateCsr() {
		// Key pair must be availabe and owner's ID must be defined for CSR to be generated.
		if (!(keyPair && ownerId)) {
			return;
		}
		$progressOpen = true;
		$snackbarMessage = undefined;
		try {
			const pkcs10 = new CertificationRequest();
			pkcs10.subject.typesAndValues.push(
				new AttributeTypeAndValue({
					type: '2.5.4.3',
					value: new Utf8String({ value: ownerId })
				})
			);
			await pkcs10.subjectPublicKeyInfo.importKey(keyPair.publicKey);
			pkcs10.attributes = [];
			await pkcs10.sign(keyPair.privateKey, 'SHA-256');
			const pkcs10Raw = pkcs10.toSchema(true).toBER();
			csrPem = toPEM(pkcs10Raw, 'CERTIFICATE REQUEST');

			$progressOpen = false;
			$snackbarMessage = $t('dashboard.csrGeneratedSuccessfully');
		} catch (e) {
			$progressOpen = false;
			$errorDialogMessage =
				(e instanceof Error ? e.message + '. ' : '') + t.get('dashboard.errorGeneratingCsr') + '.';
		}
	}

	// downloadCsr downloads current CSR.
	async function downloadCsr() {
		// Just return if required data is not available.
		if (!csrPem || !keyPair) {
			return;
		}

		$progressOpen = true;
		$snackbarMessage = undefined;

		try {
			// Download CSR in PEM formatted PKCS #10 file.
			let keyIdentifierSha256 = await getKeyIdentifier(keyPair, 'SHA-256');

			downloadPKCS10(
				csrPem,
				ownerId + '_' + keyIdentifierSha256.replaceAll(':', '').substring(0, 10) + '.csr'
			);
			$progressOpen = false;
		} catch (e) {
			$progressOpen = false;
			$errorDialogMessage =
				(e instanceof Error ? e.message + '. ' : '') + t.get('dashboard.errorDownloadingCsr') + '.';
		}
	}
</script>

<!-- /* v8 ignore start */ -->
<Paper variant="outlined" style="margin-bottom: 1rem;">
	<Title>{$t('dashboard.certificateSignignRequest')}</Title>
	<Content>
		<LayoutGrid>
			{#if csrPem}
				<Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
					<!-- Textarea with CSR content and size auto-adjusting. -->
					<Textfield
						textarea
						input$rows={csrPem.split(/\n/).length}
						input$cols={csrPem.split(/\n/).reduce((a, b) => (a.length <= b.length ? b : a)).length}
						value={csrPem}
						input$class={'code code-disabled'}
						input$spellcheck={false}
						input$style="white-space: pre; overflow: auto; pointer-events: auto;"
						input$readonly={true}
						input$resizable={false}
						input$data-testid="input-csr"
					/>
				</Cell>
			{/if}
			<Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
				{#if !csrPem}
					<!-- "pointer-events: auto;" required for tooltip over disabled button to work. -->
					<Button
						data-testid="button-generate-csr"
						on:click={() => {
							generateCsr();
						}}
						variant="outlined"
						disabled={!(keyPair && ownerId)}
						title={!ownerId
							? $t('dashboard.ownerIdFieldCannotBeEmpty')
							: !keyPair
							? $t('dashboard.keyMustBeAvailable')
							: undefined}
						style="pointer-events: auto;"
					>
						<Label>{$t('dashboard.generateCertificateSigningRequest')}</Label>
					</Button>
				{:else}
					<div
						data-testid="button-copy-csr"
						use:copy={csrPem}
						on:svelte-copy={() => ($snackbarMessage = $t('dashboard.copyToClipboardSuccess'))}
						on:svelte-copy:error={() => ($snackbarMessage = $t('dashboard.copyToClipboardFailure'))}
						style="display: inline-block"
					>
						<!-- "pointer-events: auto;" required for tooltip over disabled button to work. -->
						<Button variant="outlined" style="pointer-events: auto;">
							<Label>{$t('dashboard.copyCsrToClipboard')}</Label>
						</Button>
					</div>
					<!-- "pointer-events: auto;" required for tooltip over disabled button to work. -->
					<Button
						data-testid="button-download-csr"
						on:click={() => {
							downloadCsr();
						}}
						variant="outlined"
						style="pointer-events: auto;"
					>
						<Label>{$t('dashboard.downloadCsr')}</Label>
					</Button>
					<!-- "pointer-events: auto;" required for tooltip over disabled button to work. -->
					<Button
						data-testid="button-email-csr"
						on:click={() => {
							location.href =
								'mailto:?subject=' +
								encodeURIComponent(ownerId + ' CSR') +
								'&body=' +
								encodeURIComponent(csrPem + '\n'); // Add extra newline after CSR in message body for readability.
						}}
						variant="outlined"
						style="pointer-events: auto;"
					>
						<Label>{$t('dashboard.sendCsrViaEmail')}</Label>
					</Button>
				{/if}
			</Cell>
		</LayoutGrid>
	</Content>
</Paper>
