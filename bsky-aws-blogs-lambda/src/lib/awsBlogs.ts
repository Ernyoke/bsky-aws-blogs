import {Article} from "./article.js";

interface Response {
    items: BlogPost[]
}

interface BlogPost {
    item: Item
    tags: Tag[]
}

interface Item {
    id: string;
    dateCreated: string;
    additionalFields: AdditionalFields,
}

interface AdditionalFields {
    featuredImageUrl: string;
    postExcerpt: string;
    link: string;
    contributors: string;
    title: string;
    contentType: string
}

interface Tag {
    name: string
}

const categories: { [key: string]: string[] } = {
    'alps': ['Alps', 'AWSInSwitzerlandAndAustria'],
    'architecture': ['Architecture'],
    'aws-cost-management': ['AWSCostManagement'],
    'apn': ['AWSPartnerNetwork'],
    'awsmarketplace': ['AWSMarketplace'],
    'aws': ['News'],
    'aws-insights': ['AWSInsights'],
    'big-data': ['BigData'],
    'business-productivity': ['BusinessProductivity'],
    'compute': ['Compute'],
    'contact-center': ['ContactCenter'],
    'containers': ['Containers'],
    'database': ['Databases'],
    'desktop-and-application-streaming': ['DesktopApplication', 'Streaming'],
    'developer': ['Developers'],
    'devops': ['DevOps'],
    'enterprise-strategy': ['EnterpriseStrategy'],
    'mobile': ['FrontEnd', 'Mobile'],
    'gametech': ['GameTech'],
    'hpc': ['HPC'],
    'ibm-redhat': ['IBM', 'RedHat'],
    'infrastructure-and-automation': ['Infrastructure', 'Automation'],
    'industries': ['Industries'],
    'iot': ['IoT'],
    'machine-learning': ['AI', 'MachineLearning'],
    'mt': ['Management', 'Governance'],
    'media': ['Media'],
    'messaging-and-targeting': ['Messaging', 'Targeting'],
    'migration-and-modernization': ['Migrations', 'Modernization'],
    'modernizing-with-aws': ['ModernizingWithAWS', 'Modernization'],
    'networking-and-content-delivery': ['Networking', 'CDN'],
    'opensource': ['OpenSource'],
    'publicsector': ['PublicSector'],
    'robotics': ['Robotics'],
    'awsforsap': ['SAP'],
    'security': ['Security', 'Identity', 'Compliance'],
    'startups': ['Startups'],
    'storage': ['Storage'],
    'training-and-certification': ['Training', 'Certification']
};

function mapFromDevToFormat(blogPost: BlogPost): Article {
    return new Article(blogPost.item.id,
        blogPost.item.additionalFields.title,
        blogPost.item.additionalFields.postExcerpt,
        blogPost.item.dateCreated,
        blogPost.item.additionalFields.link,
        dropResolutionFromCoverImage(blogPost.item.additionalFields.featuredImageUrl),
        blogPost.item.additionalFields.contributors.split(', '),
        ['AWS', ...extractMainCategories(blogPost.item.additionalFields.link)]
    );
}

function extractMainCategories(link: string) {
    const groups = /^https:\/\/aws\.amazon\.com\/blogs\/(?<category>[a-zA-Z-]+)\/.*$/.exec(link)?.groups;
    if (groups && groups.category) {
        return Object.hasOwn(categories, groups.category) ? categories[groups.category] : [];
    }
    return [];
}

function dropResolutionFromCoverImage(link: string) {
    const groups = /^https:\/\/.*(?<suffix>(?<dimemsopm>-[0-9].*x[0-9].*)(?<extension>\..*$))/.exec(link)?.groups;
    if (groups && groups.suffix) {
        return `${link.replace(groups.suffix, '')}${groups.extension}`;
    }
    return link;
}

export default async function fetchArticles(page: number, articlesPerPage: number) {
    const url = `https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=${articlesPerPage}&item.locale=en_US&page=${page}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const articles = (await response.json() as Response).items;

    return articles
        .map(mapFromDevToFormat);
}
