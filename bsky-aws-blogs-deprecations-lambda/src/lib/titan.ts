import {ChatPromptTemplate} from "@langchain/core/prompts";
import {BedrockChat} from "@langchain/community/chat_models/bedrock";
import {BaseOutputParser} from "@langchain/core/output_parsers";
import {RunnableSequence} from "@langchain/core/runnables";
import {config} from "./config.js";
import {dedent} from "ts-dedent";
import {Logger} from "@aws-lambda-powertools/logger";

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
    prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            dedent`You are an AWS expert whose job is to read AWS blog posts and determine whether the blog post is about the 
            deprecation of an AWS service, product, or any related feature. Examples of such services include EC2, ECS, S3, 
            and CodeDeploy, among others. If you identify a blog post mentioning the deprecation of any such service or product, 
            you must respond with a list of all the services or products that are deprecated.
            {format_instructions}`
        ],
        [
            "human",
            dedent`Title: {title}
            {content}`
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

    constructor(private logger: Logger) {
    }

    async checkIfArticleIsAboutDeprecation(title: string, content: string) {
        const parser = new YesNoOutputParser(this.logger);
        const chain = RunnableSequence.from([
            this.prompt,
            this.model,
            parser
        ]);

        return await chain.invoke({
            title: title,
            content: content,
            format_instructions: parser.getFormatInstructions()
        });
    }
}

export enum Decision {
    False = 0,
    True = 1,
    Unknown = 3
}