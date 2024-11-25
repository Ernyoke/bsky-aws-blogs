import {Logger} from "@aws-lambda-powertools/logger";
import sizeOf from "buffer-image-size";
import sharp from "sharp";
import {fileTypeFromBuffer} from "file-type";

export default class Coverimage {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    async fetchAndResizeImage(url: string | null | undefined, maxSizeAllowed: number) {
        if (!url) {
            this.logger.info(`Empty source url provided for the cover image! Skipping uploading it!`);
            return null;
        }

        const coverImage = await fetch(url);
        const blob = await coverImage.blob();
        const arrayBuffer = Buffer.from(await blob.arrayBuffer());
        const fileType = await fileTypeFromBuffer(arrayBuffer);

        if (fileType?.mime.startsWith('image')) {
            return {
                buffer: await this.tryResize(arrayBuffer, maxSizeAllowed),
                mime: fileType.mime,
            };
        } else {
            this.logger.info(`File with mimetype ${fileType?.mime} is not an image!`);
        }

        return null;
    }

    private async tryResize(buffer: Buffer, maxSizeAllowed: number) {

        const sizeInKb = buffer.byteLength / 1024;
        if (sizeInKb <= maxSizeAllowed) {
            this.logger.info(`Cover image size is ${sizeInKb} Kb. No resize is necessary.`);
            return buffer;
        }

        const percentages = [0.9, 0.75, 0.6, 0.5, 0.4, 0.25];

        for (const percentage of percentages) {
            const sizeInKb = buffer.byteLength / 1024;

            if (sizeInKb > maxSizeAllowed) {
                const dimensions = sizeOf(buffer);

                const resizedBuffer = await sharp(buffer)
                    .resize(Math.ceil(dimensions.width * 0.5), Math.ceil(dimensions.height * 0.5))
                    .toBuffer();

                const newSize = resizedBuffer.byteLength / 1024;

                if (newSize <= maxSizeAllowed) {
                    this.logger.info(`Cover image resized to ${newSize} Kb. This is ${percentage} of the original size.`);
                    return resizedBuffer;
                }
            }
        }

        this.logger.warn(`Cover image is way too large, ${sizeInKb / 1024} Mb! Could not resize image!`);
    }
}