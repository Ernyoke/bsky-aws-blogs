import {z} from "zod";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {BedrockChat} from "@langchain/community/chat_models/bedrock";
import {StructuredOutputParser} from "@langchain/core/output_parsers";
import {RunnableSequence} from "@langchain/core/runnables";
import {config} from "./config.js";
import {dedent} from "ts-dedent";

const model = new BedrockChat({
    model: config.bedrockModelId,
    region: config.bedrockRegion
});

const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        dedent`You are an AWS expert whose job is to read AWS blog posts and determine whether the blog post is about the 
        deprecation of an AWS service, product, or any related feature. Examples of such services include EC2, ECS, S3, 
        and CodeDeploy, among others. If you identify a blog post mentioning the deprecation of any such service or product, 
        you must respond with a list of all the services or products that are deprecated.
        Use the following format for your answer: {format_instructions}.
        IMPORTANT! Ensure that your answer strictly adheres to this format. Do NOT use any other format! Avoid providing 
        your answer in free-text format.`
    ],
    [
        "human",
        "Blogpost title: {title}\nBlogpost content {content}"
    ],
]);

const parser = StructuredOutputParser.fromZodSchema(
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
        deprecatedServices: z
            .array(z.string())
            .describe("list with names of all the services which are deprecated"),
    })
);

export async function checkIfArticleContainsDeprecations(title: string, content: string) {

    const chain = RunnableSequence.from([
        prompt,
        model,
        parser,
    ]);

    return await chain.invoke({
        title: title,
        content: content,
        format_instructions: parser.getFormatInstructions(),
    });
}