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

const errorMsg = "Number must be non-negative";

const envSchema = z.object({
    BSKY_SERVICE: z.string().min(1).default("https://bsky.social"),
    BSKY_DRY_RUN: z.enum(['true', 'false']).transform((value: string) => value === 'true'),
    SECRET_NAME: z.string().min(1),
    TABLE_NAME: z.string().min(1),
    CLAUDE_MODEL_ID: z.string().min(1),
    CLAUDE_REGION: z.string().min(1),
    TITAN_MODEL_ID: z.string().min(1),
    TITAN_REGION: z.string().min(1),
    TITAN_MAX_TOKEN_SIZE: z.string()
        .transform(parseNumber)
        .refine((num) => num >= 0, {message: errorMsg}),
    NOVA_MICRO_MODEL_ID: z.string().min(1),
    NOVA_MICRO_REGION: z.string().min(1),
    NOVA_MICRO_MAX_TOKEN_SIZE: z.string()
        .transform(parseNumber)
        .refine((num) => num >= 0, {message: errorMsg}),
    NOVA_PRO_MODEL_ID: z.string().min(1),
    NOVA_PRO_REGION: z.string().min(1),
    NOVA_PRO_MAX_TOKEN_SIZE: z.string()
        .transform(parseNumber)
        .refine((num) => num >= 0, {message: errorMsg})
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
    titanMaxTokenSize: envVars.TITAN_MAX_TOKEN_SIZE,
    novaMicroModelId: envVars.NOVA_MICRO_MODEL_ID,
    novaMicroRegion: envVars.NOVA_MICRO_REGION,
    novaMicroMaxTokenSize: envVars.NOVA_MICRO_MAX_TOKEN_SIZE,
    novaProModelId: envVars.NOVA_PRO_MODEL_ID,
    novaProRegion: envVars.NOVA_PRO_REGION,
    novaProMaxTokenSize: envVars.NOVA_PRO_MAX_TOKEN_SIZE,
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
