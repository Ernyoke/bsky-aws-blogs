import {z} from "zod";
import {env} from "node:process";
import type {AtpAgentLoginOpts} from "@atproto/api";
import {getSecret} from '@aws-lambda-powertools/parameters/secrets';

const envSchema = z.object({
    BSKY_SERVICE: z.string().min(1).default("https://bsky.social"),
    BSKY_DRY_RUN: z.enum(['true', 'false']).transform((value: string) => value === 'true'),
    SECRET_NAME: z.string().min(1)
});

const envVars = envSchema.parse(env);

const secretsSchema = z.object({
    handle: z.string().min(1),
    password: z.string().min(1)
});

const secrets = secretsSchema.parse(JSON.parse(await getSecret(envVars.SECRET_NAME) ?? ''));

export const bskyAccount: AtpAgentLoginOpts = {
    identifier: secrets.handle,
    // identifier: 'awstest.bsky.social',
    password: secrets.password,
    // password: "tp6h-cucn-qj3h-vmss"
};

export const config = {
    bskyService: envVars.BSKY_SERVICE,
    bskyDryRun: envVars.BSKY_DRY_RUN
};
