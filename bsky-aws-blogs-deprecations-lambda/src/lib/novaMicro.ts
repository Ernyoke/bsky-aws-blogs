import {YesNoOutputParser} from "./yesNoOutputParser.js";
import {dedent} from "ts-dedent";
import {PromptTemplate} from "@langchain/core/prompts";
import {ChatBedrockConverse} from "@langchain/aws";
import {config} from "./config.js";
import {Logger} from "@aws-lambda-powertools/logger";

export class NovaMicro {
    summaryTemplate = dedent`
    You are an AWS expert whose job is to read AWS blog posts and determine whether the blog post is about the 
    deprecation of an AWS service, product, or any related feature. Examples of such services include EC2, ECS, S3, 
    and CodeDeploy, among others.
    ---------
    {formatInstructions}
    ---------
    Blog title: {title}
    Blog content: {content}
    ---------
    `;

    private model = new ChatBedrockConverse({
        model: config.novaMicroModelId,
        region: config.awsRegion,
        temperature: 0.1
    });

    private readonly parser: YesNoOutputParser;

    constructor(private logger: Logger) {
        this.parser = new YesNoOutputParser(this.logger);
    }

    async checkIfArticleIsAboutDeprecation(title: string, content: string) {
        const summaryChain = PromptTemplate.fromTemplate(this.summaryTemplate)
            .pipe(this.model)
            .pipe(this.parser)

        return await summaryChain.invoke({
            title: title,
            content: content,
            formatInstructions: this.parser.getFormatInstructions()
        });
    }
}