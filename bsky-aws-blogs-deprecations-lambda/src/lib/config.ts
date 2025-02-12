import {z} from "zod";
import {env} from "node:process";
import type {AtpAgentLoginOpts} from "@atproto/api";
import {getSecret} from '@aws-lambda-powertools/parameters/secrets';

const envSchema = z.object({
    BSKY_SERVICE: z.string().min(1).default("https://bsky.social"),
    BSKY_DRY_RUN: z.enum(['true', 'false']).transform((value: string) => value === 'true'),
    SECRET_NAME: z.string().min(1),
    TABLE_NAME: z.string().min(1),
    NOVA_MICRO_MODEL_ID: z.string().min(1),
    NOVA_PRO_MODEL_ID: z.string().min(1),
    AWS_REGION: z.string().min(1)
});

const envVars = envSchema.parse(env);

export const config = {
    bskyService: envVars.BSKY_SERVICE,
    bskyDryRun: envVars.BSKY_DRY_RUN,
    tableName: envVars.TABLE_NAME,
    awsRegion: envVars.AWS_REGION,
    novaMicroModelId: envVars.NOVA_MICRO_MODEL_ID,
    novaProModelId: envVars.NOVA_PRO_MODEL_ID
};

const secretsSchema = z.object({
    handle: z.string().min(1),
    password: z.string().min(1),
});

const secrets = secretsSchema.parse(JSON.parse(await getSecret(envVars.SECRET_NAME) ?? ''));

export const bskyAccount: AtpAgentLoginOpts = {
    identifier: secrets.handle,
    password: secrets.password,
};
