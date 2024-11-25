# bsky-aws-blogs

## What is this?

This project contains the source code for [AWS Blogs on 🦋](https://bsky.app/profile/awsblogs.bsky.social) and for [Deprecated by AWS](https://bsky.app/profile/deprecatedbyaws.bsky.social) bots. 

The purpose of these bot is to automatically re-share blog posts published by AWS employees/partners on [aws.amazon.com/blogs](https://aws.amazon.com/blogs)

## Deployment

### Requirements

- NodeJS 20.x
- Terraform latest version (tested with 1.9.8)
- An AWS account
- A BlueSky account
    - Create a password for your account: [https://bsky.app/settings/app-passwords](https://bsky.app/settings/app-passwords)

### Deployment Steps

1. Build the lambda layers

```
cd bsky-aws-blogs-deprecations-lambda-layer
npm install --install-links --cpu=arm64 --os=linux --omit=dev --ignore-scripts
```

```
cd bsky-aws-blogs-fetcher-lambda-layer
npm install --install-links --cpu=arm64 --os=linux --omit=dev --ignore-scripts
```

```
bsky-aws-blogs-lambda-layer
npm install --install-links --cpu=arm64 --os=linux --omit=dev --ignore-scripts
```

1. Build the lambda functions:

```
cd bsky-aws-blogs-deprecations-lambda
npm install
npm run build
```

```
cd bsky-aws-blogs-fetcher-lambda
npm install
npm run build
```

```
cd bsky-aws-blogs-lambda
npm install
npm run build
```

1. Deploy the infrastructure

```
cd infra
cp input.tfvars.example input.tfvars
# Fill in the missing values
terraform apply -var-file="input.tfvars"
```