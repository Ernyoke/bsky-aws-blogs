import {BaseOutputParser} from "@langchain/core/output_parsers";
import {Logger} from "@aws-lambda-powertools/logger";

export enum Decision {
    False = 0,
    True = 1,
    Unknown = 3
}

class CustomOutputParserFields {
}

export class YesNoOutputParser extends BaseOutputParser<Decision> {
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

export interface LlmModel {
    checkIfArticleIsAboutDeprecation(title: string, content: string): Promise<Decision>;
}