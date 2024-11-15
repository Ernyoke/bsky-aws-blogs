import {z} from "zod";
import {env} from "node:process";

const envSchema = z.object({
    TABLE_NAME: z.string().min(1),
    TOPIC_ARN: z.string().min(1),
    DRY_RUN: z.enum(['true', 'false']).transform((value) => value === 'true')
});

const envVars = envSchema.parse(env);

export const config = {
    tableName: envVars.TABLE_NAME,
    topicArn: envVars.TOPIC_ARN,
    dryRun: envVars.DRY_RUN
};
