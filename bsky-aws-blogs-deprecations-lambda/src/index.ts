import {Context, SQSEvent, SQSHandler, SQSRecord} from 'aws-lambda';
import Bot from "./lib/bot.js";
import {Article} from './lib/article.js';
import {Logger} from '@aws-lambda-powertools/logger';
import {fetchArticleAsText} from "./lib/awsBlogs.js";
import {checkIfArticleContainsDeprecations} from "./lib/bedrock.js";
import {BatchProcessor, EventType, processPartialResponse} from "@aws-lambda-powertools/batch";

const logger = new Logger();
const processor = new BatchProcessor(EventType.SQS);
const bot = new Bot(logger);

const recordHandler = async (record: SQSRecord): Promise<void> => {
    const payload = record.body;
    if (payload) {
        const article = JSON.parse(payload) as Article;
        const {isAboutDeprecation, deprecatedServices} = await checkIfArticleContainsDeprecations(article.title, await fetchArticleAsText(article.url));
        if (isAboutDeprecation) {
            logger.info(`AI decided that article ${article.id} with title "${article.title}" is about deprecating ${deprecatedServices}.`);
            try {
                // const result = await bot.post(article, deprecatedServices);
                // logger.info(`Posted article ${article.id} with title "${article.title}. Post URI: ${result?.uri}`);
            } catch (ex) {
                logger.error(`Failed to post article ${article.id} with title "${article.title}"`, {
                    error: ex
                });
            }
        } else {
            logger.info(`AI decided that article ${article.id} with title "${article.title}" is not about any service deprecation.`);
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
