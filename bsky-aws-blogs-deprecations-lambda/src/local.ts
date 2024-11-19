import {handler} from "./index.js";
import {Context, SQSEvent} from 'aws-lambda';
import {Article} from "./lib/article.js";

const art = new Article(
    'blog-posts#25-16210',
    'Announcing end-of-life for Fleet Hub feature of AWS IoT Device Management, effective October 18th, 2025',
    'AWS IoT Device Management Fleet Hub was launched in 2020 to provide customers with a web application for managing their fleet of Internet of Things (IoT) devices. Over the years, it has helped many businesses streamline their IoT fleet operations, improve efficiency, and enhance device security. However, as technology and customer needs continue to evolve, [...]',
    '2024-10-17T14:02:57+0000',
    'https://aws.amazon.com/blogs/iot/announcing-end-of-life-for-aws-iot-device-management-fleet-hub-effective-october-18th-2025/',
    'https://d2908q01vomqb2.cloudfront.net/f6e1126cedebf23e1463aee73f9df08783640400/2024/10/13/IoT-blog-image-slide-for-FleetHub-EoL.png',
    ['AWS'],
    ['AWS', 'IoT']
);

const art2 = new Article(
    'blog-posts#33-70026',
    'Migrate from Amazon Kinesis Data Analytics for SQL to Amazon Managed Service for Apache Flink and Amazon Managed Service for Apache Flink Studio',
    'Amazon Kinesis Data Analytics for SQL is a data stream processing engine that helps you run your own SQL code against streaming sources to perform time series analytics, feed real-time dashboards, and create real-time metrics. AWS has made the decision to discontinue Kinesis Data Analytics for SQL, effective January 27, 2026. In this post, we explain why we plan to end support for Kinesis Data Analytics for SQL, alternative AWS offerings, and how to migrate your SQL queries and workloads.',
    '2024-10-17T14:02:57+0000',
    'https://aws.amazon.com/blogs/big-data/migrate-from-amazon-kinesis-data-analytics-for-sql-to-amazon-managed-service-for-apache-flink-and-amazon-managed-service-for-apache-flink-studio/',
    'https://d2908q01vomqb2.cloudfront.net/b6692ea5df920cad691c20319a6fffd7a4a766b8/2024/10/17/migrate-from-amazon-kinesis-data-analytics-sql-300x169.jpg',
    ['AWS'],
    ['AWS', 'AmazonKinesis']
);

const event = {
    Records: [
        {
            messageId: "id1",
            body: JSON.stringify(art)
        },
        {
            messageId: "id2",
            body: JSON.stringify(art2)
        }
    ]
} as SQSEvent;

await handler(event, {} as Context, () => {
    console.log("Finished");
});
