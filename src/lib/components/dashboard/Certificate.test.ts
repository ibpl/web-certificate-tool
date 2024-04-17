// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

import Certificate from './Certificate.svelte';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { CERTIFICATE_PEM_REGEXP } from '$lib/common';

const invalidCertificateMessage = 'Invalid certificate.';

const ownerIdNotMatchMessage = "Certificate does not match owner's ID.";

const expiredCertificateMessage = 'Expired certificate.';

const testInvalidCrtPEM = 'dummy';

export const testEncryptedRSA2048KeyPEM = `
-----BEGIN ENCRYPTED PRIVATE KEY-----
MIIFLTBXBgkqhkiG9w0BBQ0wSjApBgkqhkiG9w0BBQwwHAQIv7snRHtZbqICAggA
MAwGCCqGSIb3DQIJBQAwHQYJYIZIAWUDBAEqBBDVnsQEuL3Rh5csiqyQxfVjBIIE
0A0y9QUhjCRiFQnckSbPZHf6cg8N2OuLHXp5G2RgZ+IL9iiIKbs7fLN3H6CcAkFZ
SpWYml5s1xj3rMZNFHEUckhcg5/XqWMn1SgycgowBk8da5NOILM62FXyqBCGkb49
uGpCtxn19arUqnlclwTYUlJUXQ4icGTcUsZRZizK9MCJH/lmfC6rIYowhk+NAnkR
gaVo6El7clO7H9KYCO+XzW+8iXZgmGuXwCvyidhgTKmwqcJSQr+W27q+bsjQMBDj
RhqVK5XyJVVxKESgTrRbJCEBhqPPRuKcQwlPQwXkiRP6DBBzqETHE3y+Wp6Na8iv
1y//PbuxufGzvVq8GE6XutyV1IxNA0KUx5YGWFXMS6xq0PTR93KuO7chzw7NAqkC
1DWCnyqGQ79X/4C3Fl1R0jKJOZUJxoLRYePMxQZURhz5P257ux5EkYN3mbuRaZWl
iazO/LAw7hheiiC7lIqNCpZM26/X5aKIA44SPtnrE6NpPO9G2GEQNEIWpUOwZPbZ
8hMwdbu9pwXDnCVfCMIccpPlwuOHoY1KIKddANneMvv1SOFNjFlkdSWTlQMAj8fR
ZY0l44pYJST8vRupbwvtgJ2JGylnGolQHMhnnMBAYJwjejecRsfA9E905/42vhul
wr5gcYwzrrxI43kpLZVLB5qU776tQFRrXzp80eYzdS+l2L3r/UiuTL817Krfd/SC
/a8bAAUui3UIayyLYhwObT09lKfAEwQYKRsFcUHbMwRK0xzCPP82v4o2BpZcSybl
susFlJ5OFB369fQrCnuDnCOB1ZL7BeWPDwMTI4JoUAcIGtRtNjDQJjsK4JiEvR5c
Rxs2u5V28ylVX4H9r6zwUeZsFoXMFAeijfw7gciTEsGn7cQwA8SZpo0smkMK8MLw
DW9HpclYtY/Hhycde4uVdS0B4zPLSHKdZJgm6ldKWH6h5etWYnGmqEDxlXqgHOK1
HhwaxL6UalW7hjcoAfp5r5oGrPiexZ7mlHu+YfDyLnPce3ccLvkqWXcqG1u4GWE4
5tnO/uzYhUTnwTuEk4Z4mz6hrwhw01JD0Vzd9V8EOqj70jC4MNwxkSWPRom1hhVU
q6z+dyShDFbGT7XJHJXiJxszx6gKSY5Foqh+ZDXh1bDbl95ll1SGQGOfbTbfhHPt
Z9NFEM/FM2IogSxiWGO4mjI5wRBMYPi1RmUrGGMMgeAqRlVqm4K8McSbSeQ2TaNg
rbWhApbhZRnIugyly54GPMGEsLlWZuXZJJJmtvq2JdihkE4XR4EEZInd5iG26o0p
dqyfiTmRltQLeI0HPh4l9FSYmyqpzJiW97cY//EJqewGPc7QrfhoG16SOOBBu5Ev
o/euMFoa4Dapq1RkRw9zWdPTL4V8txb1DwAXSjC18As/XOTP0slM3WXnVtNchdDC
AeqfM6yO2kDal3x7MJVj/cH51H0P1tv2AbIKYAq9aDAzEzhy/giqtm/+3NhdL4/g
tBB+U9LBiEBdzbpiiTDm2Y8A5cI9gn3x08SnkUSepAg9R2rxUforQmmMan4dNUo9
ZqfpgkPZ0I5lZb38TDhlFt3TbJKscSdaV8WXLwDgYK7nSzt1rc/b6z/eikLCt1fo
6CCQPM7MTebru0B8OOlNbEy9Qc7kBIHH0Jfc9hwRWuNH
-----END ENCRYPTED PRIVATE KEY-----
`;

export const testExpiredCrtPEM = `
-----BEGIN CERTIFICATE-----
MIICvTCCAaUCFEKXCyWQYKEeXHUR2ljXeOej3DqTMA0GCSqGSIb3DQEBCwUAMBsx
GTAXBgNVBAMMEHRlc3RAZXhhbXBsZS5jb20wHhcNMjQwNDEwMDgzMjI0WhcNMjQw
NDEwMDgzMjI0WjAbMRkwFwYDVQQDDBB0ZXN0QGV4YW1wbGUuY29tMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqg/URNn76XzfcFnRb5LrGBeMcOowJjxt
0+GNoMzevA5nHywsyWFQWO2H8ho+1OWNVnomJC7d3VzJkSypg1o3wiHrBC7ccDTe
wgEtGrbPQEZXwKXVez63yO3VGFQEhSiqzWp/i5739Uo1DBXm31nPUC1RZJsw6yVc
hqRdM23DD0T3srH1DAP2+XcZlv78Gv40lb8/COl/ODxGBeFRTPL3uTXXD11Aj33i
RVh78M3tLeVfmutDFFC1GVfsuS0ZOUJ2v8TwU8i2QkW0Zq3zXyrjachlPAEF1GSw
AHxpWccinB0PbOO7fmKSUO+DIlkGGAYmxHMmxLhduqJmZosewk2g2wIDAQABMA0G
CSqGSIb3DQEBCwUAA4IBAQBC0G5jN5JfTLbqvR+Ss+gGYQW7rNLRzqG6HqbP49EM
7KH/TQJoXXU5JpSfNa9ve9g48qg0AlV1gZRWb4xYUGIuKilzCZ/JDmoO1MrCfV+w
S0Ax8oaCLjClf9a5nFL39TV8//lHAJuFvhpC3VW6pene4jE/mbmP7Gvyb21UDsEz
yIZALiVUTKf7s46qOS17q7zJONeM5bt47eC9uh7wEK8+jlvKRbyHXIMzO97OgvYs
5+GtlOOeiZuUB4VVFIPmnHS2RQINVcI1f+fx61gjv5QycNRUVqFbGGZ6yYtTq4Hd
txUgX1ahdpEvef4E47jGbbnT4V0hxlR/EkMPnSGQXExv
-----END CERTIFICATE-----
`;

export const testCrtPEM = `
-----BEGIN CERTIFICATE-----
MIICvzCCAacCFCd3a1t5SkNPj5CsYg4AhhRq9HNxMA0GCSqGSIb3DQEBCwUAMBsx
GTAXBgNVBAMMEHRlc3RAZXhhbXBsZS5jb20wIBcNMjQwNDEwMDgyOTMxWhgPMjEy
NDA2MjUwODI5MzFaMBsxGTAXBgNVBAMMEHRlc3RAZXhhbXBsZS5jb20wggEiMA0G
CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCqD9RE2fvpfN9wWdFvkusYF4xw6jAm
PG3T4Y2gzN68DmcfLCzJYVBY7YfyGj7U5Y1WeiYkLt3dXMmRLKmDWjfCIesELtxw
NN7CAS0ats9ARlfApdV7PrfI7dUYVASFKKrNan+Lnvf1SjUMFebfWc9QLVFkmzDr
JVyGpF0zbcMPRPeysfUMA/b5dxmW/vwa/jSVvz8I6X84PEYF4VFM8ve5NdcPXUCP
feJFWHvwze0t5V+a60MUULUZV+y5LRk5Qna/xPBTyLZCRbRmrfNfKuNpyGU8AQXU
ZLAAfGlZxyKcHQ9s47t+YpJQ74MiWQYYBibEcybEuF26omZmix7CTaDbAgMBAAEw
DQYJKoZIhvcNAQELBQADggEBABZAJdtCY099RYeQK2BTr7nVyvVveRdc7jBzayul
R+BSQW/IE6e4VgOtBMYFOnTI02HhJS0dhpNdSGm8N8byh5R6aYHAlrYK/mVjjTFA
J+xs2aToNkS8H96SblusYvMNqqpdn0GbvgXMSPEQDDPkPBWspWn0KeUCHzRm7iVd
Ad6nTElVQ0JFkujp3DAa6rpPejjpZOGIPzajh8HKVxmKRifRmDyDZHa8p5lGmAIK
g1ukcUIGduPY+BIGe4/XrmFj1gjftxRz4piwx6WGbO0k1U+z/Alrlw2a/90bQqlg
X9UUgSxEgAhQUpoEV88Q++OQvmn/vQ1pH81M/8jU3epxG8E=
-----END CERTIFICATE-----
`;

// testCrtUploadFailure tests certificate upload failure.
async function testCrtUploadFailure(crtPem: string, ownerId: string, errorMessage: string) {
	const user = userEvent.setup();
	render(Certificate, { props: { ownerId: ownerId, password: '', keyPair: undefined } });
	const input = <HTMLInputElement>screen.getByTestId('input-load-crt');

	const file = new File([crtPem], 'test.crt', { type: 'application/x-pem-file' });
	await user.upload(input, file);

	// Error should be displayed.
	await vi.waitFor(
		() => expect(screen.getByTestId('input-crt-validation-msg')).toHaveTextContent(errorMessage),
		{
			timeout: 3000
		}
	);

	// No certificate data should be presented if certificate is invalid.
	if (!CERTIFICATE_PEM_REGEXP.test(crtPem)) {
		await vi.waitFor(() => expect(screen.queryByText(/Invalid before/i)).toBeFalsy());
		await vi.waitFor(() => expect(screen.queryByText(/Invalid after/i)).toBeFalsy());
		await vi.waitFor(() => expect(screen.queryByText(/Serial number/i)).toBeFalsy());
	}
}

// testCrtUploadSuccess tests key upload success.
async function testCrtUploadSuccess(
	crtPem: string,
	ownerId: string,
	invalidBefore: string,
	invalidAfter: string,
	serialNumber: string
) {
	const user = userEvent.setup();
	render(Certificate, { props: { ownerId: ownerId, password: '', keyPair: undefined } });
	const input = <HTMLInputElement>screen.getByTestId('input-load-crt');

	const file = new File([crtPem], 'test.crt', { type: 'application/x-pem-file' });
	await user.upload(input, file);

	// Check loaded certificate information.
	await vi.waitFor(
		() => expect(screen.getByTestId('strong-crt-invalid-before')).toHaveTextContent(invalidBefore),
		{
			timeout: 3000
		}
	);
	await vi.waitFor(
		() => expect(screen.getByTestId('strong-crt-invalid-after')).toHaveTextContent(invalidAfter),
		{
			timeout: 3000
		}
	);
	await vi.waitFor(
		() => expect(screen.getByTestId('strong-crt-serial-number')).toHaveTextContent(serialNumber),
		{
			timeout: 3000
		}
	);
}

describe('Certificate', () => {
	test('empty certificate does not produce error', async () => {
		await testCrtUploadFailure('', '', '');
	}, 20000);

	test('uploading invalid certificate fails with error', async () => {
		await testCrtUploadFailure(testInvalidCrtPEM, 'test@example.com', invalidCertificateMessage);
	}, 20000);

	test('uploading key as certificate fails with error', async () => {
		await testCrtUploadFailure(
			testEncryptedRSA2048KeyPEM,
			'test@example.com',
			invalidCertificateMessage
		);
	}, 20000);

	test("uploading certificate with different owner's ID fails with error", async () => {
		await testCrtUploadFailure(testCrtPEM, 'different@example.com', ownerIdNotMatchMessage);
	}, 20000);

	test('uploading expired certificate fails with error', async () => {
		await testCrtUploadFailure(testExpiredCrtPEM, 'test@example.com', expiredCertificateMessage);
	}, 20000);

	test('uploading valid certificate succeeds', async () => {
		await testCrtUploadSuccess(
			testCrtPEM,
			'test@example.com',
			'2024-04-10 08:29:31 UTC',
			'2124-06-25 08:29:31 UTC',
			'27:77:6b:5b:79:4a:43:4f:8f:90:ac:62:0e:00:86:14:6a:f4:73:71'
		);
	}, 20000);
});
