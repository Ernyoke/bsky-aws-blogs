import {SQSHandler, SQSRecord} from 'aws-lambda';
import Bot from "./lib/bot.js";
import {Article} from './lib/article.js';
import {Logger} from '@aws-lambda-powertools/logger';
import {fetchArticleAsText} from "./lib/awsBlogs.js";
import {isAboutDeprecation} from "./lib/bedrock.js";
import {BatchProcessor, EventType, processPartialResponse} from "@aws-lambda-powertools/batch";

const logger = new Logger();
const processor = new BatchProcessor(EventType.SQS);
const bot = new Bot(logger);

const recordHandler = async (record: SQSRecord): Promise<void> => {
    const payload = record.body;
    if (payload) {
        const article = JSON.parse(payload) as Article;
        const deprecationRes = await isAboutDeprecation(article.title, await fetchArticleAsText(article.url));
        logger.info(`Deprecations Result: ${deprecationRes}`);
        if (deprecationRes.isAboutDeprecation) {
            try {
                logger.info(`Posted article ${article.id} with title "${article.title}"`);
            } catch (ex) {
                logger.error(`Failed to post article ${article.id} with title "${article.title} `, {
                    error: ex
                });
            }
        }
    }
};

export const handler: SQSHandler = async (event, context) => {
    logger.addContext(context);
    await bot.login();
    return await processPartialResponse(event, recordHandler, processor, {
        context,
    });
}
