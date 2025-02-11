import {z} from "zod";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {ChatBedrockConverse} from "@langchain/aws";
import {StructuredOutputParser} from "@langchain/core/output_parsers";
import {RunnableSequence} from "@langchain/core/runnables";
import {config} from "./config.js";
import {dedent} from "ts-dedent";
import {Logger} from "@aws-lambda-powertools/logger";

export class NovaPro {
    systemPrompt = dedent`You are an AWS expert whose job is to read AWS blog posts and determine whether the blog post is about the 
            deprecation of an AWS service, product, or any related feature. Examples of such services include EC2, ECS, S3, 
            and CodeDeploy, among others. If you identify a blog post mentioning the deprecation of any such service or product, 
            you must respond with a list of all the services or products that are deprecated.`;

    chat = ChatPromptTemplate.fromMessages([
        [
            'system',
            dedent`{systemPrompt}
            {formatInstructions}
            IMPORTANT! Ensure that your answer strictly adheres to JSON RFC 8259. Avoid providing your answer in free-text format.`
        ],
        [
            'human',
            dedent`Blog title: {title}
            Blog content: {content}`
        ],
    ]);

    model = new ChatBedrockConverse({
        model: config.novaProModelId,
        region: config.novaProRegion
    });

    structuredParser = StructuredOutputParser.fromZodSchema(
        z.object({
            isAboutDeprecation: z
                .preprocess(val => {
                    if (typeof val === "string") {
                        if (['1', 'true'].includes(val.toLowerCase())) return true;
                        if (['0', 'false'].includes(val.toLowerCase())) return false;
                    }
                    return val;
                }, z.coerce.boolean())
                .describe("this should be true if the blog post is about deprecation of any system"),
            deprecationSummary: z
                .string()
                .describe("summarize in one short sentence what service/feature has been deprecated"),
        })
    );

    constructor(private logger: Logger) {
    }

    async checkIfArticleContainsDeprecations(title: string, content: string) {
        const chain = RunnableSequence.from([
            this.chat,
            this.model,
            this.structuredParser,
        ]);

        return await chain.invoke({
            systemPrompt: this.systemPrompt,
            title: title,
            content: content,
            formatInstructions: this.structuredParser.getFormatInstructions(),
        });
    }
}