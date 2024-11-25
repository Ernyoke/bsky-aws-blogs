import {handler} from "./index.js";
import {Context, SQSEvent} from 'aws-lambda';
import {Article} from "shared";

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

const art3 = new Article(
    'blog-posts#55-9012',
    'Event-driven Active Directory domain join with Amazon EventBridge',
    'In this blog post, I will show you how Amazon EventBridge can automate Microsoft Active Directory (AD) domain join and unjoin for your Amazon Elastic Compute Cloud (Amazon EC2) instances. In a previous blog post, I showed you how AWS Systems Manager Automation can dynamically domain join and unjoin EC2 instances manually. I have worked [...]',
    '2024-11-22T03:28:31Z',
    'https://aws.amazon.com/blogs/modernizing-with-aws/event-driven-active-directory-domain-join-with-amazon-eventbridge/',
    'https://d2908q01vomqb2.cloudfront.net/8effee409c625e1a2d8f5033631840e6ce1dcb64/2024/11/22/Screenshot-2024-11-21-222739-300x157.jpg',
    ['Syed Ahmad'],
    ['AWS', 'Modernization']
);

const art4 = new Article(
    'blog-posts#74-935',
    'Deprecation of AWS Application Discovery Service Discovery Connector',
    'After careful consideration, we have made the decision to end support for AWS Application Discovery Service Discovery Connector (Discovery Connector) effective November 17, 2025. This decision was made to enable focus on the new on-premises discovery tool AWS Application Discovery Service Agentless Collector (Agentless Collector). This decision stems from customer preference to use agentless collection for [...]',
    '2024-11-12T18:06:24Z',
    'https://aws.amazon.com/blogs/migration-and-modernization/deprecation-of-aws-application-discovery-service-discovery-connector/',
    'https://d2908q01vomqb2.cloudfront.net/1f1362ea41d1bc65be321c0a378a20159f9a26d0/2024/11/05/Deprecation-of-AWS-Application-Discovery-Service-Discovery-Connector-300x169.png',
    ['Krysha Nair', 'Gabriel Wiebe'],
    ['AWS', 'Migrations', 'Modernization']
);

const art5 = new Article(
    'blog-posts#34-93255',
    'Implement secure API access to your Amazon Q Business applications with IAM federation user access management',
    '',
    '2024-11-22T18:02:32+0000',
    'https://aws.amazon.com/blogs/machine-learning/implement-secure-api-access-to-your-amazon-q-business-applications-with-iam-federation-user-access-management/',
    'https://d2908q01vomqb2.cloudfront.net/f1f836cb4ea6efb2a0b1b99f41ad8b103eff4b59/2024/11/19/Picture1-9.jpg',
    ["Abhinav Jawadekar", "Zia Seymour"],
    ["AWS", "AI", "MachineLearning"]
)

const event = {
    Records: [
        {
            messageId: "id1",
            body: JSON.stringify(art)
        },
        {
            messageId: "id2",
            body: JSON.stringify(art2)
        },
        {
            messageId: "id3",
            body: JSON.stringify(art3)
        },
        {
            messageId: "id4",
            body: JSON.stringify(art4)
        },
        {
            messageId: "id5",
            body: JSON.stringify(art5)
        }
    ]
} as SQSEvent;

await handler(event, {} as Context, () => {
    console.log("Finished");
});
