import {z} from "zod";
import {env} from "node:process";
import type {AtpAgentLoginOpts} from "@atproto/api";
import {getSecret} from '@aws-lambda-powertools/parameters/secrets';

const parseNumber = (val: string) => {
    const parsed = Number(val);
    if (isNaN(parsed)) {
        throw new Error("Invalid number");
    }
    return parsed;
};

const envSchema = z.object({
    BSKY_SERVICE: z.string().min(1).default("https://bsky.social"),
    BSKY_DRY_RUN: z.enum(['true', 'false']).transform((value: string) => value === 'true'),
    SECRET_NAME: z.string().min(1),
    TABLE_NAME: z.string().min(1),
    CLAUDE_MODEL_ID: z.string().min(1),
    CLAUDE_REGION: z.string().min(1),
    TITAN_MODEL_ID: z.string().min(1),
    TITAN_REGION: z.string().min(1),
    NOVA_MODEL_ID: z.string().min(1),
    NOVA_REGION: z.string().min(1),
    TITAN_MAX_TOKEN_SIZE: z.string()
        .transform(parseNumber)
        .refine((num) => num >= 0, {message: "Number must be non-negative"}),
    NOVA_MAX_TOKEN_SIZE: z.string()
        .transform(parseNumber)
        .refine((num) => num >= 0, {message: "Number must be non-negative"}),
});

const envVars = envSchema.parse(env);

export const config = {
    bskyService: envVars.BSKY_SERVICE,
    bskyDryRun: envVars.BSKY_DRY_RUN,
    tableName: envVars.TABLE_NAME,
    claudeModelId: envVars.CLAUDE_MODEL_ID,
    claudeRegion: envVars.CLAUDE_REGION,
    titanModelId: envVars.TITAN_MODEL_ID,
    titanRegion: envVars.TITAN_REGION,
    novaModelId: envVars.NOVA_MODEL_ID,
    novaRegion: envVars.NOVA_REGION,
    titanMaxTokenSize: envVars.TITAN_MAX_TOKEN_SIZE,
    novaMaxTokenSize: envVars.TITAN_MAX_TOKEN_SIZE,
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
