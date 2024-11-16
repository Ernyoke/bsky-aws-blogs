# bsky-aws-blogs-deprecations-lambda 🦋

This lambda function will poll events from an SQS queue. From these, it will extract the information from an AWS
blog post. Using ML it will decide if the blog post is about deprecating one or more AWS services. In the article mentions
any service deprecations, it will publish a new post to BlueSky https://bsky.app/profile/deprecatedbyaws.bsky.social with
the article and with the services being deprecated.

## How to use

### Things you will need

- A Bluesky account. Sign up here: https://bsky.app/
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