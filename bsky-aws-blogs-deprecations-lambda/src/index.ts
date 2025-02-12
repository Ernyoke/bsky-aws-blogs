import {Context, SQSEvent, SQSHandler, SQSRecord} from 'aws-lambda';
import Bot from "./lib/bot.js";
import {Logger} from '@aws-lambda-powertools/logger';
import {fetchArticleAsText} from "./lib/awsBlogs.js";
import {BatchProcessor, EventType, processPartialResponse} from "@aws-lambda-powertools/batch";
import {Article} from "shared";
import {Decision} from "./lib/yesNoOutputParser.js";
import {NovaMicro} from "./lib/novaMicro.js";
import {NovaPro} from "./lib/novaPro.js";

const logger = new Logger();
const processor = new BatchProcessor(EventType.SQS);
const bot = new Bot(logger);
const novaMicro = new NovaMicro(logger);
const novaPro = new NovaPro(logger);

const recordHandler = async (record: SQSRecord): Promise<void> => {
    const payload = record.body;
    if (payload) {
        const article = JSON.parse(payload) as Article;
        try {
            const articleText = await fetchArticleAsText(article.url);
            switch (await novaMicro.checkIfArticleIsAboutDeprecation(article.title, articleText)) {
                case Decision.False:
                    logger.info(`NovaMicro decided that article ${article.id} with title "${article.title}" is NOT about deprecations.`);
                    break;
                case Decision.Unknown:
                    logger.info(`NovaMicro could not decide if article ${article.id} with title "${article.title}" is about deprecations.`);
                    // Fall through and double check with NovaPro
                case Decision.True:
                    // Double check with NovaPro
                    const {
                        isAboutDeprecation,
                        deprecationSummary
                    } = await novaPro.checkIfArticleContainsDeprecations(article.title, articleText);
                    if (isAboutDeprecation) {
                        logger.info(`NovaPro decided that article ${article.id} with title "${article.title}" is about deprecating services.`);
                        const result = await bot.post(article, deprecationSummary);
                        logger.info(`Posted article ${article.id} with title "${article.title}. Post URI: ${result?.uri}`);
                    } else {
                        logger.info(`NovaPro decided that article ${article.id} with title "${article.title}" is not about any service deprecation.`);
                    }
                    break;
            }
        } catch (ex) {
            logger.error(`Failed to post article ${article.id} with title "${article.title}"`, {
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
