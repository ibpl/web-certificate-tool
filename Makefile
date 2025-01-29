# SPDX-License-Identifier: AGPL-3.0-only
# SPDX-FileCopyrightText: 2024 Informatyka Boguslawski sp. z o.o. sp.k. <https://www.ib.pl>

# Run test in watch mode only if WATCH=1 is set in the environment.
ifeq ($(WATCH),1)
test_run_arg = watch
else
test_run_arg = run
endif

# Build a production version.
build: node_modules
	npm run prepare
	npm run build

# Start development server and open application in web browser.
.PHONY: dev
dev: node_modules
	npm run prepare
	npm run dev -- --open

# Remove compiled and cached files (before building retry).
.PHONY: clean
clean:
	rm -rf .svelte-kit coverage build node_modules vite.config.ts.timestamp-*

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
	npm run test $(test_run_arg) $(path)

# Code coverage.
.PHONY: coverage
coverage: node_modules
	npm run coverage

# Format code.
.PHONY: format
format: node_modules
	npm run format

# Lint code.
.PHONY: lint
lint: node_modules
	npm run lint
	npm run check
	pipx run reuse lint
