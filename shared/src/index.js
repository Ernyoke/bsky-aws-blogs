"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("@aws-lambda-powertools/logger");
const buffer_image_size_1 = __importDefault(require("buffer-image-size"));
const sharp_1 = __importDefault(require("sharp"));
const file_type_1 = require("file-type");
class CoverImage {
    logger;
    constructor(logger = new logger_1.Logger({})) {
        this.logger = logger;
    }
    async resizeImage(url, maxSizeAllowed) {
        if (!url) {
            this.logger.info(`Empty source url provided for the cover image! Skipping uploading it!`);
            return;
        }
        const coverImage = await fetch(url);
        const blob = await coverImage.blob();
        const arrayBuffer = Buffer.from(await blob.arrayBuffer());
        const fileType = await (0, file_type_1.fileTypeFromBuffer)(arrayBuffer);
        return await this.tryResize(arrayBuffer, maxSizeAllowed);
    }
    async tryResize(buffer, maxSizeAllowed) {
        const sizeInKb = buffer.byteLength / 1024;
        if (sizeInKb <= maxSizeAllowed) {
            this.logger.info(`Cover image size is ${sizeInKb} Kb. No resize is necessary.`);
            return buffer;
        }
        const percentages = [0.9, 0.75, 0.6, 0.5, 0.4, 0.25];
        for (const percentage of percentages) {
            const sizeInKb = buffer.byteLength / 1024;
            if (sizeInKb > maxSizeAllowed) {
                const dimensions = (0, buffer_image_size_1.default)(buffer);
                const resizedBuffer = await (0, sharp_1.default)(buffer)
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
