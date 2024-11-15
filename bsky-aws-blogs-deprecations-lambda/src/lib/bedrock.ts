import {z} from "zod";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {BedrockChat} from "@langchain/community/chat_models/bedrock";
import {StructuredOutputParser} from "@langchain/core/output_parsers";
import {RunnableSequence} from "@langchain/core/runnables";

const model = new BedrockChat({
    // model: "anthropic.claude-instant-v1",
    model: "anthropic.claude-3-haiku-20240307-v1:0",
    region: 'us-east-1'
});

const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You are a AWS expert who's job is to read AWS blog posts and decide if the blogpost is about deprecation of a certain system. " +
        "If yes, you should list all the services which are deprecated! " +
        "Use the following format for your answer: {format_instructions}"
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

export async function isAboutDeprecation(title: string, content: string) {

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