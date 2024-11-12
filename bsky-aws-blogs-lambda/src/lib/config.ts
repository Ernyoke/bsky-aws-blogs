import {z} from "zod";
import {env} from "node:process";
import type {AtpAgentLoginOpts} from "@atproto/api";
import {getSecret} from '@aws-lambda-powertools/parameters/secrets';

const secretsSchema = z.object({
    handle: z.string().min(1),
    password: z.string().min(1),
    service: z.string().min(1).default("https://bsky.social"),
});

const secrets = secretsSchema.parse(JSON.parse(await getSecret('bsky_awsblogs_secrets') ?? ''));

export const bskyAccount: AtpAgentLoginOpts = {
    identifier: secrets.handle,
    password: secrets.password,
};

const envSchema = z.object({
    BSKY_DRY_RUN: z.enum(['true', 'false']).transform((value) => value === 'true'),
    TABLE_NAME: z.string().min(1)
});

const envVars = envSchema.parse(env);

export const config = {
    bskyService: secrets.service,
    bskyDryRun: envVars.BSKY_DRY_RUN,
    tableName:  envVars.TABLE_NAME
};
