import {bskyAccount, config} from "./config.js";
import type {AppBskyFeedPost, AtpAgentLoginOpts,} from "@atproto/api";
import atproto from "@atproto/api";
import {Article} from "./article.js";
import {Logger} from "@aws-lambda-powertools/logger";
import moment from "moment";
import sizeOf from "buffer-image-size";
import sharp from "sharp";
import { dedent } from "ts-dedent";

const {BskyAgent} = atproto;

type BotOptions = {
    service: string | URL;
    dryRun: boolean;
};

const defaultOptions: BotOptions = {
    service: config.bskyService,
    dryRun: config.bskyDryRun,
}

export default class Bot {
    #agent;

    constructor(private logger: Logger, options: BotOptions = defaultOptions) {
        const {service} = options;
        this.#agent = new BskyAgent({service});
    }

    login(loginOpts: AtpAgentLoginOpts = bskyAccount) {
        return this.#agent.login(loginOpts);
    }

    async post(article: Article, deprecatedServices: string[], dryRun: boolean = defaultOptions.dryRun) {
        if (dryRun) {
            this.logger.info(`Article with title ${article.title} not posted! Reason: dry run.`);
            return;
        }

        const encoder = new TextEncoder();

        const coverImageData = await this.resizeAndUploadImage(article.cover);

        const warningWithServices: string = dedent`
            ⚠️ Deprecation warning!
            
            The following services are getting deprecated: ${deprecatedServices.join(', ')}
            
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

    async resizeAndUploadImage(url: string | null | undefined, dryRun: boolean = defaultOptions.dryRun) {

        if (!url) {
            this.logger.info(`Empty source url provided for the cover image! Skipping uploading it!`);
            return;
        }

        const coverImage = await fetch(url);
        const blob = await coverImage.blob();
        const arrayBuffer = Buffer.from(await blob.arrayBuffer());
        const resizedBuffer = await this.tryResize(arrayBuffer);

        if (dryRun) {
            this.logger.info(`Cover image not uploaded! Reason: dry run`);
            return;
        }

        const {data} = await this.#agent.uploadBlob(resizedBuffer, {encoding: blob.type});

        return data;
    }

    async tryResize(buffer: Buffer) {
        const MAX_SIZE = 976.56; // max size allowed in Kb

        const sizeInKb = buffer.byteLength / 1024;
        if (sizeInKb <= MAX_SIZE) {
            this.logger.info(`Cover image size is ${sizeInKb} Kb. No resize is necessary.`);
            return buffer;
        }

        const percentages = [0.9, 0.75, 0.6, 0.5, 0.4, 0.25];

        for (const percentage of percentages) {
            const sizeInKb = buffer.byteLength / 1024;

            if (sizeInKb > MAX_SIZE) {
                const dimensions = sizeOf(buffer);

                const resizedBuffer = await sharp(buffer)
                    .resize(Math.ceil(dimensions.width * 0.5), Math.ceil(dimensions.height * 0.5))
                    .toBuffer();

                const newSize = resizedBuffer.byteLength / 1024;

                if (newSize <= MAX_SIZE) {
                    this.logger.info(`Cover image resized to ${newSize} Kb. This is ${percentage} of the original size.`);
                    return resizedBuffer;
                }
            }
        }

        this.logger.warn(`Cover image is way too large, ${sizeInKb / 1024} Mb! Could not resize image!`);
    }
}
