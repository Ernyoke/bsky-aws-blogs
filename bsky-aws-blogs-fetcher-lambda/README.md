# bsky-aws-blogs-fetcher-lambda 🦋

This is a Lambda Function which querries the aws.amazon.com/blogs API on a schedule. 
If there are new blog posts, it will publish it to an SNS topic.

## How to use

### Things you will need

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