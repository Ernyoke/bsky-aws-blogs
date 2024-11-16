# bsky-aws-blogs-lambda 🦋

Listens to an SQS queue where new blog posts are pushed. Re-shares them to https://bsky.app/profile/awsblogs.bsky.social

## How to use

### Things you will need

- A BlueSky account. Sign up here: https://bsky.app/
- An AWS account
- Node.js

To build this repo, you need [Node.js](https://nodejs.org/en) version 20.x.

### Build Steps

```
npm ci
npm run build:prod
```

### Environment variables for local development

- Copy the content of `.env.example` file into a new `.env` file.
- Fill in the required values.