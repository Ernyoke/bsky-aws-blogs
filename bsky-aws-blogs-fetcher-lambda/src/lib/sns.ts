import {Logger} from "@aws-lambda-powertools/logger";
import {PublishCommand, SNSClient} from "@aws-sdk/client-sns";
import {config} from "./config.js";
import {Article} from "shared";

export default class SNSPublisher {
    private client: SNSClient;

    constructor(private logger: Logger) {
        this.client = new SNSClient({});
    }

    async publishArticles(articles: Article[]): Promise<number> {
        const promises = articles.map(async article => {
            return await this.client.send(
                new PublishCommand({
                    Message: JSON.stringify(article),
                    TopicArn: config.topicArn
                }),
            );
        });

        const results = await Promise.allSettled(promises);

        let nrFailures = 0;

        for (let i = 0; i < results.length; i++) {
            if (results[i].status === 'rejected') {
                this.logger.error('Failed to publish article!', {
                    error: results[i],
                    article: articles[i]
                });
                nrFailures++;
            }
        }

        return articles.length - nrFailures;
    }
}