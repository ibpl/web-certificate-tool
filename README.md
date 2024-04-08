<!--
SPDX-License-Identifier: AGPL-3.0-only
SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>
-->

# Web Certificate Tool

A client-side rendered web application that facilitates the creation of client keys and certificates for TLS. It is built on top of [Web Crypto](https://en.wikipedia.org/wiki/Web_Cryptography_API), [PKIjs](https://pkijs.org/), [SvelteKit](https://kit.svelte.dev/) and [SMUI](https://sveltematerialui.com/).

## Downloading

To download source code with `git` use

```
git clone https://github.com/ibpl/web-certrificate-tool
```

## Building

Building this project requires a working, up-to-date `make`, `npm`, `pipx` and `sed`.

All commands described below should be run in the root directory of the downloaded project.

### Auditing

To audit the dependencies for security vulnerabilities use

```
make audit
```

### Updating

To update dependencies use

```
make update
```

### Development

To start the development server and open the application in a web browser use

```
make dev
```

### Formatting

To format code use

```
make format
```

### Linting

To lint use

```
make lint
```

### Coverage

To run code coverage use

```
make coverage
```

### Testing

To run all tests use

```
make test
```

To run only the test files that contain `components/common` in their path add `path` like this

```
make test path=components/common
```

`path` only checks inclusion and doesn't support regexp or glob patterns (unless your terminal processes it before make receives the `path`).

When `WATCH=1` is set in the environment, test will enter the watch mode, i.e.

```
WATCH=1 make test
```

### Production

To build application for production use

```
make
```

The application files ready to be copied to production webserver will be in the `build` subdirectory.

`build` subdirectory contains uncompressed application files and its gzip and brotli precompressed equivalents for web servers and web clients that are able to use precompressed versions for download optimization.

## Installation

After successful build, copy files from `build` subdirectory to directory served (as static content) over HTTPS (i.e. by [Apache](https://httpd.apache.org/)) and access it using up-to-date web browser with JavaScript enabled.

For better security cosider:

- serving all application files over HTTPS with [`Strict-Transport-Security: 31536000`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security) header,
- serving all application files with [response security headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) that allows application to load only required resources i.e.

```
Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline' 'self'; connect-src 'self'; style-src 'unsafe-inline' 'self'; img-src 'self' data:; font-src 'self' data:;
```

## Configuration

Optional `config.json` file may be placed in application's root folder with the following optional parameters:

- `locale` [string]: forces specified initial locale to be one of [supported locales](src/lib/i18n/lang.json),
- `ownerId` [string]: forces specified initial owner's ID (value length must be in range 1-300),
- `themeMode` [string]: forces initial theme mode to be light (when `light`) or dark (when `dark`).

Example `config.json` content:

```
{
	"ownerId": "test@example.com",
	"themeMode": "dark",
	"locale": "pl"
}
```

The following, optional query parameters may be specified in URL:

- `l` [string]: forces specified initial locale to be one of [supported locales](src/lib/i18n/lang.json),
- `oid` [string]: forces specified initial owner's ID (value length must be in range 1-300),
- `tm` [string]: forces initial theme mode to be light (when `light`) or dark (when `dark`).

Example URL:

```
https://wtc.example.com/?l=pl&tm=light&oid=test@example.com
```

Setting source precendence (from highest to lowest):

- URL query,
- `config.json`,
- user's system/browser current setting (`en` locale will be used as fallback if users's browser locale is not [supported](src/lib/i18n/lang.json)).

## Usage

Application operates on data (i.e. keys, certificate requests, certificates) locally in browser using [PKIjs](https://pkijs.org/).

### Keys

#### Generation

Application allows to generate RSA-2048 keys.

#### Saving

Application allows to save private RSA key in PKCS #8 PEM formatted file without encryption or (if password is specified) encrypted with PBKDF2/SHA-256/AES-256-CBC (similar as openssl 3.0 does).

#### Loading

Application allows to load private RSA key from PKCS #8 PEM formatted file without encryption or (if password is specified) encrypted with alghorithm supported by [PKIjs](https://pkijs.org/) (i.e. PBKDF2/SHA-256/AES-256-CBC as saved by this application or generated with openssl 3.0). Keys are loaded locally in browser using [PKIjs](https://pkijs.org/)

## Licenses

Content in this repository is licensed under the [GNU Affero General Public License Version 3 (AGPL v3)](LICENSES/AGPL-3.0-only.txt). Other licenses may be specified as well where third-party content is used.

Detailed copyright and licensing is declared in accordance with the [REUSE Specification – Version 3.0](https://reuse.software/spec/).
