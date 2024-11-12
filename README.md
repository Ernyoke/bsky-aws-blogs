# bsky-aws-community-builder-blogposts

## What is this?

This project contains the source code for [AWS Community Builder Blog Posts](https://bsky.app/profile/awscmblogposts.bsky.social) bot. The purpose of this bot is to automatically re-share blog posts published by AWS Community Builders on [DEV.to](https://dev.to/aws-builders).

## Deployment

### Requirements

- NodeJS 20.x
- Terraform latest version (tested with 1.9.8)
- An AWS account
- A BlueSky account
    - Create a password for your account: [https://bsky.app/settings/app-passwords](https://bsky.app/settings/app-passwords)

### Deployment Steps

1. Build the lambda function:

```
cd bsky-aws-community-builder-blogposts-lambda
npm ci
npm run build:prod
```

2. Deploy the infrastructure

```
cd infra
cp input.tfvars.example input.tfvars
# Fill in the missing values
terraform apply -var-file="input.tfvars"
```