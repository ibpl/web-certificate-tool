// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import DashboardPage from './DashboardPage.svelte';
import { render, screen } from '@testing-library/svelte';
import { progressOpen } from '$lib/stores';
import userEvent from '@testing-library/user-event';
import { OWNER_ID_MAX_LENGTH } from '$lib/common';
import FileSaver from 'file-saver';
import { errorDialogMessage } from '$lib/stores';
import { get } from 'svelte/store';
import { testEncryptedRSA2048KeyPEM, testCrtPEM } from './Certificate.test';

// For testing for copy to clipboard call.
Object.assign(navigator, {
	clipboard: {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		writeText: () => {}
	}
});

const testRSA2048KeyPEM = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDWd36XkqIpXeqr
C8aXgfOPKhQuJgySAq6i42AUup+GD+hPp+TGBtGYfHZlwhVEvSChZoyCXuPUAcam
GwdN04XBU882JzqQrLJg5QYC0C3gIRSpYPxHlqoI5f6Lm3IsqKx0qrPB62Cs9Lxy
EHBwiZ46LathqMlk2SLED8VR216Blx6jBpw5KZB19XGIqzw5flWibfBXqVYIiiUC
driPh17V6YVey++poY7sApcVIzKyhKhGmqgCa013PrHQ60bOLtiFDyTWCsCVHqYk
Osz5Bo3h0G9Q+fZ5Q0/IuSdJ0hGqKnvFxd/W23jnabxAD815phAU3dFlWpRm7Kgm
Ww8P3CSrAgMBAAECggEBAImI4Bn74xp8K/2884I9yB/LcF2X8P/B0JSNFBS3CY5D
rUtH9CI6RTdwuczQBiuqzb4zsW/5wkk3SllDhA+Y0nIEeSHVTm1xEoOo2436SzEs
hb+Jfr+6ExjZxb9p1HJnSREYV2bIt5qy6BaODE1fM6VDnGBoiZ6u0OjC5Ft2PskD
H5RD4R7vqi4hL5Gv8zVeVGH4NQOy1DwVOQL/PPejlZdiAAiuwf+noDzQgzTpPh3h
t7LHRe0cMB/uGPB4XQyLxQrkWS8QvI8VP/v7zGg9Km8VIntJlUMqZyJazPUFa2yt
N59SvO35NriUWsobMfyJxPutbWJdKVMMJgPKk56QSuECgYEA9+oAwLlGmLP7NefT
+DpEwb1Z/zxgEbd70fJzov05YsTnXdIBhiw0PqlRpuIq2ulabmBg5nLmj/GmlBrK
CgzTDbtoX2zZPPSvEKE3KV0ttv/eYhVzzpS11YNkoA+mBXjjzoeqIFLtdsMEf+FH
YtKHos3BO1QT+PWHw/WiDdkV52cCgYEA3XY32GmWjaNzzW7+XZJnGsznjjX3bRwa
QaowvnM8e7gtW08CVkzbte6H6HFElgTDFKrB81Xb1i2fwuN28XA+U1XvWmeZF0Dq
SlbRZY0396CT32Ak0MKQ3+pwIzxNOsoWbsrlzZgEfiXKNP9C2UUsmQ1mvvPmnLVp
UbwDGfYo4h0CgYEAy7sYjUh01I6rtbvi/Q3dbR1PdSnHhSe08G5/SwUwAJPx0q7/
I6T19jys5ijcsPOtpiE74IWyJb6fdvyg5itt0c4d0rWfvLEToOXrb+mr5MRWm2In
vi+FUoZczhCuDbcv9oyUaWXc0YkoDHM0d+itIERYNIo+s4wK2yXj2993WacCgYEA
irqplRnfw+5mdoRXN4qkp/c//qfzzRfTotrYGhXaB66CSzadQi53W+qGnKeHzWpC
QkoNoT9hrTN7ZvxS4D/t6wpkG//VuOljWxozpifmrWqb90wlA9k+I+aaRJhb0L4T
e2gCuN3HwrYtizF0UOKyY1YvzOLAzd4ekaLzVmoLhkkCgYBBaOL0titx6cSGfZcw
p4KANr54jduC3zHHsdvbgffKOOg6Ny5ryXQ0jSb3rMQblVh/3wR0FcjTyTyBbqXG
3W6VM3Krmh7HWtvv1IvwUX2YYPP97W+1ph09aNGe0KXrYTqM+jiaBNQGoA36cFcl
v9L9iuxoXA5IjjauCYIPNbDxrg==
-----END PRIVATE KEY-----`;

const testCSRPEM = `-----BEGIN CERTIFICATE REQUEST-----
MIICXjCCAUgCAQAwGzEZMBcGA1UEAwwQdGVzdEBleGFtcGxlLmNvbTCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBANZ3fpeSoild6qsLxpeB848qFC4mDJIC
rqLjYBS6n4YP6E+n5MYG0Zh8dmXCFUS9IKFmjIJe49QBxqYbB03ThcFTzzYnOpCs
smDlBgLQLeAhFKlg/EeWqgjl/oubciyorHSqs8HrYKz0vHIQcHCJnjotq2GoyWTZ
IsQPxVHbXoGXHqMGnDkpkHX1cYirPDl+VaJt8FepVgiKJQJ2uI+HXtXphV7L76mh
juwClxUjMrKEqEaaqAJrTXc+sdDrRs4u2IUPJNYKwJUepiQ6zPkGjeHQb1D59nlD
T8i5J0nSEaoqe8XF39bbeOdpvEAPzXmmEBTd0WValGbsqCZbDw/cJKsCAwEAAaAA
MAsGCSqGSIb3DQEBCwOCAQEAd4+YVG5ZFWvk98TjW4vZp+JGE9dzm84H/qFk3ddv
qlBlzi59D2kI0mfw7sbOJteeVCnyrcCMpS70uaFl9D3mEzxUZXCtU0CJ2sDeyc9W
9SBro3XqncXTFa7etNdm5xHV4ZF5vHS289njIkLny1hikMhGRqzVN9+wuAA2xWTi
HnOpRBJ7KCTr6i3m8UFnjibLiGkQ9gQIDDyhpoB6GW+Zn799C1YS14KxqCnCYbdQ
8Y7IzN1MRCepYrDQZddPa0WoTkwjKu3pjLtH6bINc//nEp1JJ784GVTSYgsfGyQH
Mr/c/eEdrnyVazgzAyG4D7Xifvq1RE+x6C6NgtavnrYA9Q==
-----END CERTIFICATE REQUEST-----`;

describe('DashboardPage', () => {
	test('rendering works', () => {
		render(DashboardPage);
		const dashboardPageHeader = screen.getByText((content, element) => {
			return element?.tagName.toLowerCase() === 'h6' && content === 'Web Certificate Tool';
		});
		expect(dashboardPageHeader).toBeTruthy();
	});
	test('page content is enabled when progress is closed', async () => {
		const { container } = render(DashboardPage);
		progressOpen.set(false);
		await vi.waitFor(() => {
			const div = container.querySelector('.disabled');
			expect(expect(div).toBeFalsy());
		});
	});
	test('page content is disabled when progress is open', async () => {
		const { container } = render(DashboardPage);
		progressOpen.set(true);
		await vi.waitFor(() => {
			const div = container.querySelector('.disabled');
			expect(expect(div).toBeTruthy());
		});
	});

	test('CSR generation, downloading, copying and resetting works', async () => {
		const user = userEvent.setup();
		render(DashboardPage);
		const inputOwnerId = screen.getByTestId('input-ownerid');
		const inputPassword = screen.getByTestId('input-password');
		let buttonGenerateCsr = screen.getByTestId('button-generate-csr');

		// Check whether CSR generation button is disabled when no owner's ID and key pair is available.
		expect(buttonGenerateCsr.getAttribute('disabled')).toBe('');

		// Type owner's ID (max allowed length) and check whether CSR generation button is still disabled.
		await user.type(inputOwnerId, 'a'.repeat(OWNER_ID_MAX_LENGTH));
		expect(buttonGenerateCsr.getAttribute('disabled')).toBe('');

		// Provide password and click key generate button to generate and download new key.
		await user.type(inputPassword, 'b'.repeat(30));
		const spy = vi.spyOn(FileSaver, 'saveAs');
		global.URL.createObjectURL = vi.fn();
		global.URL.revokeObjectURL = vi.fn();
		await user.click(screen.getByTestId('button-generate-and-download-key'));
		await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1), { timeout: 3000 });

		// CSR generation button should be enabled.
		expect(buttonGenerateCsr.getAttribute('disabled')).toBe(null);

		// Click CSR generate button and check if CSR has been generated.
		await user.click(buttonGenerateCsr);
		const inputCsr = <HTMLInputElement>screen.getByTestId('input-csr');
		await vi.waitFor(() => expect(inputCsr.value).toMatch(/-----BEGIN CERTIFICATE REQUEST-----/i));

		// Click CSR download button to download CSR.
		await user.click(screen.getByTestId('button-download-csr'));
		await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(2), { timeout: 3000 });

		// Click CSR copy to clipboard button and check if worked.
		const spy1 = vi.spyOn(navigator.clipboard, 'writeText');
		await user.click(screen.getByTestId('button-copy-csr'));
		await vi.waitFor(() => expect(spy1).toHaveBeenCalledTimes(1), { timeout: 3000 });

		// Remove owner's ID and check whether CSR textarea is absent and CSR generation button is displayed again as disabled.
		await user.clear(inputOwnerId);
		await vi.waitFor(() => expect(screen.queryAllByTestId('input-csr')).toHaveLength(0), {
			timeout: 3000
		});
		buttonGenerateCsr = screen.getByTestId('button-generate-csr');
		await vi.waitFor(() => expect(buttonGenerateCsr.getAttribute('disabled')).toBe(''));
	}, 20000);

	test('generating CSR for uploaded test RSA 2048 key succeeds', async () => {
		const user = userEvent.setup();
		render(DashboardPage);

		// Enter test owner's ID.
		await user.type(screen.getByTestId('input-ownerid'), 'test@example.com');

		// Upload test RSA 2048 key.
		errorDialogMessage.set('');
		const input = <HTMLInputElement>screen.getByTestId('input-load-key');
		const file = new File([testRSA2048KeyPEM], 'test.key', { type: 'application/x-pem-file' });
		await user.upload(input, file);

		// No error should be set.
		await vi.waitFor(() => expect(get(errorDialogMessage)).toBe(''), { timeout: 3000 });

		// Click CSR generate button and check if generated CSR has expected content.
		await user.click(screen.getByTestId('button-generate-csr'));
		const inputCsr = <HTMLInputElement>screen.getByTestId('input-csr');
		await vi.waitFor(() => expect(inputCsr.value).toBe(testCSRPEM + '\n'));
	}, 20000);

	test('PKCS #12 generation and downloading works', async () => {
		const user = userEvent.setup();
		render(DashboardPage);
		const buttonGenerateAndDownloadP12 = screen.getByTestId('button-generate-and-download-p12');

		// Check whether PKCS #12 downloading button is disabled when no owner's ID, password nor key pair is available.
		expect(buttonGenerateAndDownloadP12.getAttribute('disabled')).toBe('');

		// Type owner's ID and check whether PKCS #12 downloading button is still disabled.
		await user.type(screen.getByTestId('input-ownerid'), 'test@example.com');
		expect(buttonGenerateAndDownloadP12.getAttribute('disabled')).toBe('');

		// Type password and check whether PKCS #12 downloading button is still disabled.
		await user.type(screen.getByTestId('input-password'), '1234');
		expect(buttonGenerateAndDownloadP12.getAttribute('disabled')).toBe('');

		// Upload key and check whether PKCS #12 downloading button is still disabled.
		const inputKey = <HTMLInputElement>screen.getByTestId('input-load-key');
		const fileKey = new File([testEncryptedRSA2048KeyPEM], 'test.key', {
			type: 'application/x-pem-file'
		});
		await user.upload(inputKey, fileKey);
		expect(inputKey.files).toBeTruthy();
		if (inputKey.files) {
			expect(inputKey.files[0]).toStrictEqual(fileKey);
			expect(inputKey.files.item(0)).toStrictEqual(fileKey);
			expect(inputKey.files).toHaveLength(1);
		}
		expect(buttonGenerateAndDownloadP12.getAttribute('disabled')).toBe('');

		// Upload valid certificate and check whether PKCS #12 downloading button is enabled.
		const inputCrt = <HTMLInputElement>screen.getByTestId('input-load-crt');
		const fileCrt = new File([testCrtPEM], 'test.crt', { type: 'application/x-pem-file' });
		await user.upload(inputCrt, fileCrt);
		await vi.waitFor(() =>
			expect(buttonGenerateAndDownloadP12.getAttribute('disabled')).toBe(null)
		);

		// Click PKCS #12 download key to generate and download PKCS #12.
		// It's a long operation so wait up to 120s for completion. See https://github.com/PeculiarVentures/PKI.js/issues/403
		const spy = vi.spyOn(FileSaver, 'saveAs');
		global.URL.createObjectURL = vi.fn();
		global.URL.revokeObjectURL = vi.fn();
		await user.click(buttonGenerateAndDownloadP12);
		await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1), { timeout: 120000 });
	}, 130000); // Long test as above.
});
