import {Context, SQSEvent, SQSHandler, SQSRecord} from 'aws-lambda';
import Bot from "./lib/bot.js";
import {Logger} from '@aws-lambda-powertools/logger';
import {BatchProcessor, EventType, processPartialResponse} from "@aws-lambda-powertools/batch";
import {Article} from "shared";

const logger = new Logger();
const processor = new BatchProcessor(EventType.SQS);
const bot = new Bot(logger);

const recordHandler = async (record: SQSRecord): Promise<void> => {
    const payload = record.body;
    if (payload) {
        const article = JSON.parse(payload) as Article;
        try {
            const result = await bot.post(article);
            logger.info(`Posted article ${article.id} with title "${article.title}. Post URI: ${result?.uri}"`);
        } catch (ex) {
            logger.error(`Failed to post article ${article.id} with title "${article.title} `, {
                error: ex
            });
            throw ex;
        }
    }
};

export const handler: SQSHandler = async (event: SQSEvent, context: Context) => {
    logger.addContext(context);
    logger.info(`Received batch of ${event.Records.length} events from SQS.`);
    await bot.login();
    return await processPartialResponse(event, recordHandler, processor, {
        context,
        processInParallel: true
    });
}
