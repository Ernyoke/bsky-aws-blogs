# bsky-aws-blogs

## What is this?

This project contains the source code for [AWS Blogs on 🦋](https://bsky.app/profile/awsblogs.bsky.social) bot. 
The purpose of this bot is to automatically re-share blog posts published by AWS employees/partners on [aws.amazon.com/blogs](https://aws.amazon.com/blogs)

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