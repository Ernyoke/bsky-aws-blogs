locals {
  topic_name              = "${var.project_name}-topic"
  blogs_queue_name        = "${var.project_name}-queue"
  deprecations_queue_name = "${var.project_name}-deprecatins-queue"
}

resource "aws_sns_topic" "topic" {
  name = local.topic_name
}

resource "aws_sqs_queue" "blogs_queue" {
  name                       = local.blogs_queue_name
  message_retention_seconds  = 1209600 // 14 days (max)
  receive_wait_time_seconds  = 20      // long polling
  visibility_timeout_seconds = 6 * local.blogs_lambda_timeout
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.blogs_queue_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "blogs_queue_dlq" {
  name = "${local.blogs_queue_name}-dlq"
}

resource "aws_sqs_queue" "deprecations_queue" {
  name                       = local.deprecations_queue_name
  message_retention_seconds  = 1209600 // 14 days (max)
  receive_wait_time_seconds  = 20      // long polling
  visibility_timeout_seconds = 6 * local.deprecations_lambda_timeout
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.deprecations_queue_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "deprecations_queue_dlq" {
  name = "${local.deprecations_queue_name}-dlq"
}

resource "aws_sns_topic_subscription" "blogs_queue_subscription" {
  protocol             = "sqs"
  raw_message_delivery = true
  topic_arn            = aws_sns_topic.topic.arn
  endpoint             = aws_sqs_queue.blogs_queue.arn
}

resource "aws_sns_topic_subscription" "deprecations_queue_subscription" {
  protocol             = "sqs"
  raw_message_delivery = true
  topic_arn            = aws_sns_topic.topic.arn
  endpoint             = aws_sqs_queue.deprecations_queue.arn
}

data "aws_iam_policy_document" "blogs_queue_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage",
    ]

    resources = [
      aws_sqs_queue.blogs_queue.arn
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        aws_sns_topic.topic.arn
      ]
    }
  }
}

data "aws_iam_policy_document" "deprecations_queue_policy_document" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage",
    ]

    resources = [
      aws_sqs_queue.deprecations_queue.arn
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values = [
        aws_sns_topic.topic.arn
      ]
    }
  }
}

resource "aws_sqs_queue_policy" "blogs_queue_policy" {
  queue_url = aws_sqs_queue.blogs_queue.id
  policy    = data.aws_iam_policy_document.blogs_queue_policy_document.json
}

resource "aws_sqs_queue_policy" "deprecations_queue_policy" {
  queue_url = aws_sqs_queue.deprecations_queue.id
  policy    = data.aws_iam_policy_document.deprecations_queue_policy_document.json
}