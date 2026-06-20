.PHONY: setup test test-unit test-integration

setup:
	npm ci

test:
	npm test

test-unit:
	npm run test:unit

test-integration:
	npm run test:integration
