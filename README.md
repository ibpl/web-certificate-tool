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

For better security cosider serving all application files with [response security headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) that disallow application to connect to any external services i.e.

```
Content-Security-Policy: default-src 'self'
```

## Configuration

Optional `config.json` file may be placed in application's root folder with the following parameters:

- `darkTheme` [boolean]: forces initial theme mode to be light (when `false`) or dark (when `true`); when not defined user's system default theme mode will be used,
- `locale` [string]: forces specified initial locale to be one of [supported locales](src/lib/i18n/lang.json); when not defined user's browser locale will be used with fallback to `en` if user's browser locale is not supported.

Example `config.json` content:

```
{
	"darkTheme": false,
	"locale": "pl"
}
```

## Licenses

Content in this repository is licensed under the [GNU Affero General Public License Version 3 (AGPL v3)](LICENSES/AGPL-3.0-only.txt). Other licenses may be specified as well where third-party content is used.

Detailed copyright and licensing is declared in accordance with the [REUSE Specification – Version 3.0](https://reuse.software/spec/).
