import {Context, SQSEvent, SQSHandler, SQSRecord} from 'aws-lambda';
import Bot from "./lib/bot.js";
import {Logger} from '@aws-lambda-powertools/logger';
import {fetchArticleAsText} from "./lib/awsBlogs.js";
import {BatchProcessor, EventType, processPartialResponse} from "@aws-lambda-powertools/batch";
import {Decision, TitanModel} from "./lib/titan.js";
import {ClaudeModel} from "./lib/claude.js";
import {Article} from "shared";

const logger = new Logger();
const processor = new BatchProcessor(EventType.SQS);
const bot = new Bot(logger);
const titan = new TitanModel(logger);
const claude = new ClaudeModel(logger);

const recordHandler = async (record: SQSRecord): Promise<void> => {
    const payload = record.body;
    if (payload) {
        const article = JSON.parse(payload) as Article;
        try {
            const articleText = await fetchArticleAsText(article.url);
            switch (await titan.checkIfArticleIsAboutDeprecation(article.title, articleText)) {
                case Decision.False:
                    logger.info(`Titan decided that article ${article.id} with title "${article.title}" is NOT about deprecations.`);
                    break;
                case Decision.Unknown:
                    logger.info(`Titan could not decide if article ${article.id} with title "${article.title}" is about deprecations.`);
                    // Fall through and double check with Claude
                case Decision.True:
                    // Double check with Claude
                    const {
                        isAboutDeprecation,
                        deprecationSummary
                    } = await claude.checkIfArticleContainsDeprecations(article.title, articleText);
                    if (isAboutDeprecation) {
                        logger.info(`Claude decided that article ${article.id} with title "${article.title}" is about deprecating services.`);
                        const result = await bot.post(article, deprecationSummary);
                        logger.info(`Posted article ${article.id} with title "${article.title}. Post URI: ${result?.uri}`);
                    } else {
                        logger.info(`Claude decided that article ${article.id} with title "${article.title}" is not about any service deprecation.`);
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
