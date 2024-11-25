export default class Article {
    constructor(public id: string,
                public title: string,
                public postExcerpt: string,
                public publishedDate: string,
                public url: string,
                public cover: string,
                public authorList: string[],
                public categories: string[]
    ) {
    }
}
