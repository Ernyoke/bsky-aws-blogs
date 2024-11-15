import { parse } from 'node-html-parser';
import {convert} from "html-to-text";

export async function fetchArticleAsText(url: string) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Could not fetch article from ${url}: ${response.status}`);
    }

    const htmlContent = await response.text();
    const root = parse(htmlContent);
    const blogPostContent = root.querySelector('.blog-post-content');

    const blogPost = blogPostContent ? blogPostContent.toString() : '<main></main>';

    return convert(blogPost, {wordwrap: 130});
}