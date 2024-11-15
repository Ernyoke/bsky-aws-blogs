import {
    BatchWriteItemCommand,
    DynamoDBClient,
    PutRequest,
    QueryCommand,
    QueryCommandInput
} from "@aws-sdk/client-dynamodb";
import {Article} from "./article.js";
import {marshall} from "@aws-sdk/util-dynamodb";
import _ from "lodash";
import {Logger} from "@aws-lambda-powertools/logger";
import {config} from "./config.js";

const tableName = config.tableName;

export default class DynamoClient {
    private client: DynamoDBClient;

    constructor(private logger: Logger) {
        this.client = new DynamoDBClient({});
    }

    async checkIfArticleExists(article: Article) {
        const input = {
            "ExpressionAttributeValues": {
                ":id": {
                    "S": article.id.toString()
                }
            },
            "KeyConditionExpression": "ArticleId = :id",
            "TableName": tableName
        } as QueryCommandInput;

        const command = new QueryCommand(input);
        const response = await this.client.send(command);

        return response.Items && response.Items.length > 0;
    }

    async saveArticles(articles: Article[], dryRun: boolean = config.dryRun) {
        if (dryRun) {
            this.logger.warn('Articles not saved into DynamoDB. Reason: dry-run');
            return 0;
        }

        // Calculate the expireAt time (90 days from now) in epoch second format
        const expireAt = Math.floor((new Date().getTime() + 90 * 24 * 60 * 60 * 1000) / 1000);

        const chunks = _.chunk(articles, 25);

        const results =
            await Promise.allSettled(chunks.map(chunk => this.saveArticleBatch(chunk, expireAt)));

        let nrFailures = 0;

        for (let i = 0; i < results.length; i++) {
            if (results[i].status === 'rejected') {
                this.logger.error('Failed to save batch!', {
                    error: results[i],
                    batch: chunks[i]
                });
                nrFailures++;
            }
        }

        return articles.length - nrFailures;
    }

    async saveArticleBatch(articles: Article[], expireAt: number) {
        const putRequests = articles.map(article => {
            const item = marshall({
                ArticleId: article.id,
                Title: article.title,
                Authors: article.authorList,
                PublishedDateTime: new Date(article.publishedDate).getTime() / 1000,
                TimeToExist: expireAt
            });
            return {
                "PutRequest": {
                    "Item": item,
                } as PutRequest
            };
        });

        const command = new BatchWriteItemCommand({
            "RequestItems": {
                [`${tableName}`]: putRequests
            }
        });

        return await this.client.send(command);
    }
}
