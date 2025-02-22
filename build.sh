#!/bin/sh

set -e -x

(cd shared && npm install --install-links --cpu=arm64 --os=linux --omit=dev --ignore-scripts && npm run build)

(cd bsky-aws-blogs-deprecations-lambda-layer/nodejs && npm install --install-links --cpu=arm64 --os=linux --omit=dev --ignore-scripts --legacy-peer-deps)

(cd bsky-aws-blogs-fetcher-lambda-layer/nodejs &&npm install --install-links --cpu=arm64 --os=linux --omit=dev --ignore-scripts)

(cd bsky-aws-blogs-lambda-layer/nodejs && npm install --install-links --cpu=arm64 --os=linux --omit=dev --ignore-scripts)

(cd bsky-aws-blogs-deprecations-lambda && npm install && npm run build)

(cd bsky-aws-blogs-fetcher-lambda && npm install && npm run build)

(cd bsky-aws-blogs-lambda && npm install && npm run build)