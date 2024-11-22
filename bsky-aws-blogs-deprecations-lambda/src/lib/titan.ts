import {ChatPromptTemplate} from "@langchain/core/prompts";
import {BedrockChat} from "@langchain/community/chat_models/bedrock";
import {BaseOutputParser} from "@langchain/core/output_parsers";
import {config} from "./config.js";
import {dedent} from "ts-dedent";
import {Logger} from "@aws-lambda-powertools/logger";
import _ from 'lodash';
import {RunnableSequence} from "@langchain/core/runnables";

const maxTokenSize = config.titanMaxTokenSize;

class CustomOutputParserFields {
}

class YesNoOutputParser extends BaseOutputParser<Decision> {
    lc_namespace = ["langchain", "output_parsers"];

    constructor(private logger: Logger, fields?: CustomOutputParserFields) {
        super(fields);
    }

    async parse(llmOutput: string): Promise<Decision> {
        this.logger.info(`Received the following answer from the model: ${llmOutput}`)
        const lowerCaseLlmOutput = llmOutput.toLowerCase();

        if (lowerCaseLlmOutput.includes("yes")) {
            return Decision.True;
        }

        if (lowerCaseLlmOutput.includes("no")) {
            return Decision.False;
        }

        return Decision.Unknown;
    }

    getFormatInstructions(): string {
        return `You should answer with either YES or NO. Important: Don't include anything else in your answer!!!`;
    }
}

export class TitanModel {
    systemPrompt = dedent`You are an AWS expert whose job is to read AWS blog posts and determine whether the blog post is about the 
            deprecation of an AWS service, product, or any related feature. Examples of such services include EC2, ECS, S3, 
            and CodeDeploy, among others. If you identify a blog post mentioning the deprecation of any such service or product, 
            you must respond with a list of all the services or products that are deprecated.`;
    chat = ChatPromptTemplate.fromMessages([
        [
            'system',
            '{systemPrompt}\n{formatInstructions}'
        ],
        [
            'human',
            dedent`Blog title: {title}
            Blog content: {content}`
        ],
    ]);

    private model = new BedrockChat({
        model: config.titanModelId,
        region: config.titanRegion,
        modelKwargs: {
            textGenerationConfig: {
                temperature: 0.1
            }
        }
    });

    private parser: YesNoOutputParser;

    constructor(private logger: Logger) {
        this.parser = new YesNoOutputParser(this.logger);
    }

    async checkIfArticleIsAboutDeprecation(title: string, content: string) {
        content = await this.fitContentIntoTokenWindow(title, content);

        const chain = RunnableSequence.from([
            this.chat,
            this.model,
            this.parser
        ]);

        return await chain.invoke({
            systemPrompt: this.systemPrompt,
            title: title,
            content: content,
            formatInstructions: this.parser.getFormatInstructions()
        });
    }

    async fitContentIntoTokenWindow(title: string, content: string): Promise<string> {
        const messages = await this.chat.format({
            systemPrompt: this.systemPrompt,
            title: title,
            content: content,
            formatInstructions: this.parser.getFormatInstructions()
        });

        const nrTokens = await this.model.getNumTokens(messages);
        this.logger.info(`Number of tokens for the article ${title}: ${nrTokens}`);

        const charTokenRatio = messages.length / nrTokens;

        if (nrTokens > maxTokenSize) {
            const nrTokensSystemPrompt = await this.model.getNumTokens(this.systemPrompt + this.parser.getFormatInstructions() + 1);
            const maxNrTokensAllowed = maxTokenSize - nrTokensSystemPrompt;
            const currentNrTokensContent = nrTokens - nrTokensSystemPrompt;
            const charsToCut = _.toInteger((currentNrTokensContent - maxNrTokensAllowed) * charTokenRatio + 1);
            this.logger.info(`Number of tokens for the article ${title} does not fit into ${maxTokenSize} tokens allowed. Cut ${charsToCut} characters.`);
            return content.substring(0, content.length - title.length - charsToCut - 1);
        } else {
            this.logger.info(`Number of tokens for the article ${title} fits into the window of ${maxTokenSize} tokens`);
        }

        return content;
    }
}

export enum Decision {
    False = 0,
    True = 1,
    Unknown = 3
}