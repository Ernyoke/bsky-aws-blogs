import {bskyAccount, config} from "./config.js";
import atproto, {AppBskyFeedPost, AtpAgentLoginOpts, BlobRef,} from "@atproto/api";
import {Logger} from "@aws-lambda-powertools/logger";
import moment from "moment";
import {Article, CoverImage} from "shared";

const {BskyAgent} = atproto;

const MAX_GRAPHEMES = 300 // Max number of graphemes allowed by BlueSky

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

    async post(article: Article, dryRun: boolean = defaultOptions.dryRun) {
        const resizeResult = await this.#coverImage.fetchAndResizeImage(article.cover, MAX_SIZE);

        let coverImageData = null;
        if (resizeResult) {
            const uploadResponse = await this.#agent.uploadBlob(resizeResult?.buffer, {encoding: resizeResult?.mime});
            coverImageData = uploadResponse.data;
        }

        let record = this.buildRichTextRecord(article, coverImageData?.blob);

        const postLength = record.text.length;
        if (postLength > MAX_GRAPHEMES) {
            this.logger.warn(`Post length for article '${article.title}' exceeds ${MAX_GRAPHEMES} graphemes. Content is truncated.`);
            article.title =
                this.truncateToGraphemes(article.title, Math.max(0, article.title.length - (postLength - MAX_GRAPHEMES)));
            record = this.buildRichTextRecord(article, coverImageData?.blob);
        }

        if (dryRun) {
            this.logger.info(`Article with title ${article.title} not posted! Reason: dry run.`);
            return;
        }

        return await this.#agent.post(record);
    }

    buildRichTextRecord(article: Article, coverImageData: BlobRef | undefined) {
        const encoder = new TextEncoder();
        const titleAndAuthors = `📰 New article by ${article.authorList.join(', ')}\n\n${article.title}\n`;

        let offset = encoder.encode(titleAndAuthors).byteLength + 1;

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

        const fullText = `${titleAndAuthors}\n${textLineWithTags}`;

        return {
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
                    // Description cannot be empty, use title in case it is empty!
                    description: article.postExcerpt ? article.postExcerpt : article.title,
                    thumb: coverImageData
                }
            }
        } as AppBskyFeedPost.Record;
    }

    truncateToGraphemes(text: string, maxGraphemes: number): string {
        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
        const graphemes = [...segmenter.segment(text)].map(segment => segment.segment);

        if (graphemes.length > maxGraphemes) {
            return graphemes.slice(0, maxGraphemes - 1).join("") + "…"; // Adding ellipsis
        }
        return text;
    }
}
