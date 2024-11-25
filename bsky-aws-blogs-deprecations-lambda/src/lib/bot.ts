import {bskyAccount, config} from "./config.js";
import type {AppBskyFeedPost, AtpAgentLoginOpts,} from "@atproto/api";
import atproto from "@atproto/api";
import {Logger} from "@aws-lambda-powertools/logger";
import moment from "moment";
import { dedent } from "ts-dedent";
import {Article, CoverImage} from "shared";

const {BskyAgent} = atproto;

type BotOptions = {
    service: string | URL;
    dryRun: boolean;
};

const defaultOptions: BotOptions = {
    service: config.bskyService,
    dryRun: config.bskyDryRun,
}

const MAX_SIZE = 976.56; // max size allowed in Kb allowed for an image for uploading it to Bsky

export default class Bot {
    #agent;
    #coverImage: CoverImage;

    constructor(private logger: Logger, options: BotOptions = defaultOptions) {
        const {service} = options;
        this.#agent = new BskyAgent({service});
        this.#coverImage = new CoverImage(this.logger);
    }

    login(loginOpts: AtpAgentLoginOpts = bskyAccount) {
        return this.#agent.login(loginOpts);
    }

    async post(article: Article, deprecationSummary: string, dryRun: boolean = defaultOptions.dryRun) {
        if (dryRun) {
            this.logger.info(`Article with title ${article.title} not posted! Reason: dry run.`);
            return;
        }

        const encoder = new TextEncoder();

        const resizeResult = await this.#coverImage.fetchAndResizeImage(article.cover, MAX_SIZE);

        let coverImageData = null;
        if (resizeResult) {
            const uploadResponse = await this.#agent.uploadBlob(resizeResult?.buffer, {encoding: resizeResult?.mime});
            coverImageData = uploadResponse.data;
        }

        const warningWithServices: string = dedent`
            ⚠️ Deprecation warning!
            
            ${deprecationSummary}
            
            `;

        let offset = encoder.encode(warningWithServices).byteLength + 1;

        const tagsFacets = [];
        const hashTags: string[] = [];
        let textLineWithTags = '';
        for (const tag of article.categories) {
            const hashTag = `#${tag}`;
            const hashTagLength = encoder.encode(hashTag).byteLength;
            tagsFacets.push(
                {
                    index: {
                        byteStart: offset,
                        byteEnd: offset + hashTagLength
                    },
                    features: [{
                        $type: 'app.bsky.richtext.facet#tag',
                        tag: tag
                    }]
                }
            );
            offset += (hashTagLength + 1);
            hashTags.push(hashTag);
        }
        textLineWithTags += `${hashTags.join(' ')}`;

        const fullText = dedent`${warningWithServices}
        ${textLineWithTags}
        
        Read the full article:`;

        const record = {
            '$type': 'app.bsky.feed.post',
            createdAt: moment(article.publishedDate).toISOString(),
            text: fullText,
            facets: [
                ...tagsFacets
            ],
            embed: {
                "$type": 'app.bsky.embed.external',
                external: {
                    uri: article.url,
                    title: article.title,
                    description: article.postExcerpt,
                    thumb: coverImageData?.blob
                }
            }
        } as AppBskyFeedPost.Record;

        return await this.#agent.post(record);
    }
}
