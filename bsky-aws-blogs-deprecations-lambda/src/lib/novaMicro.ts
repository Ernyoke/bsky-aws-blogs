import {LlmModel, YesNoOutputParser} from "./llm.js";
import {dedent} from "ts-dedent";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {ChatBedrockConverse} from "@langchain/aws";
import {config} from "./config.js";
import {Logger} from "@aws-lambda-powertools/logger";
import {BaseMessage, trimMessages} from "@langchain/core/messages";
import _ from "lodash";

const maxTokenSize = config.novaMicroMaxTokenSize;

export class NovaMicro implements LlmModel {
    systemPrompt = dedent`You are an AWS expert whose job is to read AWS blog posts and determine whether the blog post is about the 
            deprecation of an AWS service, product, or any related feature. Examples of such services include EC2, ECS, S3, 
            and CodeDeploy, among others. If you identify a blog post mentioning the deprecation of any such service or product, 
            you must respond with a list of all the services or products that are deprecated.`;
    chatMessages = ChatPromptTemplate.fromMessages([
        [
            'system',
            '{systemPrompt}\n{formatInstructions}'
        ],
        [
            'human',
            dedent`Blog title: {title}
            Blog content: {content}`
        ],
        // Required because the trimmer tends to drop the last message from the chat from some reason
        [
            'human',
            'END'
        ]
    ]);

    private model = new ChatBedrockConverse({
        model: config.novaMicroModelId,
        region: config.novaMicroRegion,
        temperature: 0.1
    });

    private readonly parser: YesNoOutputParser;

    constructor(private logger: Logger) {
        this.parser = new YesNoOutputParser(this.logger);
    }

    async checkIfArticleIsAboutDeprecation(title: string, content: string) {
        const trimmer = trimMessages({
            // TODO: find a better solution for this. It seems like getNumTokens is not as accurate.
            maxTokens: _.toInteger(maxTokenSize * 0.8),
            tokenCounter: async (messages: BaseMessage[]) => {
                const nrTokens = await this.model.getNumTokens(
                    messages
                        .map(message => message.content)
                        .join('')
                );
                this.logger.debug(`Tokens size ${nrTokens}`);
                return nrTokens;
            },
            strategy: "first",
            allowPartial: true,
        });

        const chain = trimmer
            .pipe(this.model)
            .pipe(this.parser);

        const messages = await this.chatMessages.formatMessages(
            {
                systemPrompt: this.systemPrompt,
                title: title,
                content: content,
                formatInstructions: this.parser.getFormatInstructions(),
            }
        )

        return await chain.invoke(messages);
    }
}