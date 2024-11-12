# bsky-aws-community-builder-blogposts-lambda 🦋

This is a Lambda Function which querries the Forem (DEV.to) on a schedule. If there are new blog posts, re-shares them on BlueSky.

## How to use

### Things you will need

- A Bluesky account

BlueSky is free and available for everyone. Sign up here: https://bsky.app/

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