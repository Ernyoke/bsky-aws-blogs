export class Article {
    constructor(public id: string,
                public title: string,
                public url: string,
                public authorList: string[],
                public categories: string[],
                public postExcerpt?: string,
                public publishedDate?: string,
                public cover?: string,
    ) {
    }
}

export class ArticleBuilder {
    private id!: string;
    private title!: string;
    private url!: string;
    private authorList: string[] = [];
    private categories: string[] = [];
    private postExcerpt?: string;
    private publishedDate?: string;
    private cover?: string;

    public setId(id: string): ArticleBuilder {
        this.id = id;
        return this;
    }

    public setTitle(title: string): ArticleBuilder {
        this.title = title;
        return this;
    }

    public setUrl(url: string): ArticleBuilder {
        this.url = url;
        return this;
    }

    public setPostExcerpt(postExcerpt: string): ArticleBuilder {
        this.postExcerpt = postExcerpt;
        return this;
    }

    public setPublishedDate(publishedDate: string): ArticleBuilder {
        this.publishedDate = publishedDate;
        return this;
    }

    public setCover(cover: string): ArticleBuilder {
        this.cover = cover;
        return this;
    }

    public addAuthors(...authors: string[]): ArticleBuilder {
        this.authorList.push(...authors);
        return this;
    }

    public addCategories(...categories: string[]): ArticleBuilder {
        this.categories.push(...categories);
        return this;
    }

    public build(): Article {
        if (!this.id || !this.title || !this.url) {
            throw new Error('id, title, and url are required fields');
        }

        return new Article(
            this.id,
            this.title,
            this.url,
            this.authorList,
            this.categories,
            this.postExcerpt,
            this.publishedDate,
            this.cover
        );
    }
}
