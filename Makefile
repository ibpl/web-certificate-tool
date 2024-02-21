# SPDX-License-Identifier: AGPL-3.0-only
# SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

# *** Remove all NODE_OPTIONS='' when https://github.com/sveltejs/kit/issues/9989 is fixed.

# Build a production version.
build: node_modules
	npm run prepare
	NODE_OPTIONS='' npm run build

# Start development server and open application in web browser.
.PHONY: dev
dev: node_modules
	npm run prepare
	NODE_OPTIONS='' npm run dev -- --open

# Remove compiled and cached files (before building retry).
.PHONY: clean
clean:
	rm -rf .svelte-kit build node_modules

# Install dependencies.
node_modules:
	npm ci

# Run a security audit.
.PHONY: audit
audit: node_modules
	npm audit

# Update dependencies.
.PHONY: update
update: node_modules
	npm update --save

# Run tests.
.PHONY: test
test: node_modules
	NODE_OPTIONS='' npm run test

# Code coverage.
.PHONY: coverage
coverage: node_modules
	NODE_OPTIONS='' npm run coverage

# Format code.
.PHONY: format
format: node_modules
	NODE_OPTIONS='' npm run format

# Lint code.
.PHONY: lint
lint: node_modules
	NODE_OPTIONS='' npm run lint
	NODE_OPTIONS='' npm run check
