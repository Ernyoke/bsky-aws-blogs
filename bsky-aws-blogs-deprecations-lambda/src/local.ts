import {handler} from "./index.js";
import {Context, SQSEvent} from "aws-lambda";
import {ArticleBuilder} from "shared";

const deprecation = new ArticleBuilder()
    .setId("blog-posts#25-16210")
    .setTitle("Announcing end-of-life for Fleet Hub feature of AWS IoT Device Management, effective October 18th, 2025")
    .setUrl("https://aws.amazon.com/blogs/iot/announcing-end-of-life-for-aws-iot-device-management-fleet-hub-effective-october-18th-2025/")
    .setPostExcerpt("AWS IoT Device Management Fleet Hub was launched in 2020 to provide customers with a web application for managing their fleet of Internet of Things (IoT) devices. Over the years, it has helped many businesses streamline their IoT fleet operations, improve efficiency, and enhance device security. However, as technology and customer needs continue to evolve, [...]")
    .setCover("https://d2908q01vomqb2.cloudfront.net/f6e1126cedebf23e1463aee73f9df08783640400/2024/10/13/IoT-blog-image-slide-for-FleetHub-EoL.png")
    .addAuthors("AWS")
    .addCategories("AWS", "IoT")
    .build()

const notDeprecation = new ArticleBuilder()
    .setId('blog-posts#33-70026')
    .setTitle('Migrate from Amazon Kinesis Data Analytics for SQL to Amazon Managed Service for Apache Flink and Amazon Managed Service for Apache Flink Studio')
    .setPostExcerpt('Amazon Kinesis Data Analytics for SQL is a data stream processing engine that helps you run your own SQL code against streaming sources to perform time series analytics, feed real-time dashboards, and create real-time metrics. AWS has made the decision to discontinue Kinesis Data Analytics for SQL, effective January 27, 2026. In this post, we explain why we plan to end support for Kinesis Data Analytics for SQL, alternative AWS offerings, and how to migrate your SQL queries and workloads.')
    .setPublishedDate('2024-10-17T14:02:57+0000')
    .setUrl('https://aws.amazon.com/blogs/big-data/migrate-from-amazon-kinesis-data-analytics-for-sql-to-amazon-managed-service-for-apache-flink-and-amazon-managed-service-for-apache-flink-studio/')
    .setCover('https://d2908q01vomqb2.cloudfront.net/b6692ea5df920cad691c20319a6fffd7a4a766b8/2024/10/17/migrate-from-amazon-kinesis-data-analytics-sql-300x169.jpg')
    .addAuthors('AWS')
    .addCategories('AWS', 'AmazonKinesis')
    .build();

const longArticle = new ArticleBuilder()
    .setId('blog-posts#38-24723')
    .setTitle('Simplify global hybrid connectivity with AWS Cloud WAN and AWS Direct Connect integration')
    .setPostExcerpt('In this post, we review how you can build hybrid connectivity architectures using the AWS Cloud WAN built-in support for AWS Direct Connect attachments. We share best practices and considerations for designing global hybrid networks on AWS that help you enable seamless connectivity between your on-premises environments and the AWS Cloud. Now, AWS Cloud WAN [...]')
    .setPublishedDate('2024-11-25T19:41:39+0000')
    .setUrl('https://aws.amazon.com/blogs/networking-and-content-delivery/simplify-global-hybrid-connectivity-with-aws-cloud-wan-and-aws-direct-connect-integration/')
    .setCover('https://d2908q01vomqb2.cloudfront.net/5b384ce32d8cdef02bc3a139d4cac0a22bb029e8/2024/11/24/filename_x4l7b8b_1200x628.jpg')
    .addAuthors("Alexandra Huides", "Jordan Rojas Garcia")
    .addCategories("AWS", "CDN", "Networking")
    .build();

const event = {
    Records: [
        {
            messageId: "id1",
            body: JSON.stringify(deprecation)
        },
        {
            messageId: "id2",
            body: JSON.stringify(notDeprecation)
        },
        {
            messageId: "id3",
            body: JSON.stringify(longArticle)
        }
    ]
} as SQSEvent;

await handler(event, {} as Context, () => {
    console.log("Finished");
});
