locals {
  blogs_function_name = "${var.project_name}-lambda"
  blogs_zip_path      = "${path.module}/temp/${local.blogs_function_name}.zip"
}

resource "aws_lambda_function" "blogs_lambda" {
  function_name                  = local.blogs_function_name
  handler                        = "index.handler"
  memory_size                    = 1024
  package_type                   = "Zip"
  role                           = aws_iam_role.blogs_lambda_role.arn
  runtime                        = "nodejs20.x"
  filename                       = local.blogs_zip_path
  source_code_hash               = data.archive_file.blogs_lambda_zip.output_base64sha256
  timeout                        = 60 * 5 // 5 minutes
  architectures                  = ["arm64"]
  reserved_concurrent_executions = 1

  environment {
    variables = {
      BSKY_DRY_RUN = var.dry_run
      SECRET_NAME  = aws_secretsmanager_secret.bsky_secrets.name
    }
  }
}

data "archive_file" "blogs_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../${local.blogs_function_name}/dist"
  output_path = local.blogs_zip_path
}

resource "aws_lambda_event_source_mapping" "blogs_event_source_mapping" {
  event_source_arn = aws_sqs_queue.blogs_queue.arn
  enabled          = true
  function_name    = aws_lambda_function.blogs_lambda.arn
  batch_size       = 10
}

## Lambda Role
data "aws_iam_policy_document" "blogs_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "blogs_lambda_role" {
  assume_role_policy = data.aws_iam_policy_document.blogs_assume_role.json
  name               = "${local.blogs_function_name}-role"
}

resource "aws_iam_role_policy_attachment" "blogs_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.blogs_lambda_role.name
}

## Allow access to Secrets Manager
data "aws_iam_policy_document" "blogs_read_secrets" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetResourcePolicy",
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
      "secretsmanager:ListSecretVersionIds"
    ]

    resources = [
      aws_secretsmanager_secret.bsky_secrets.arn,
    ]
  }
}

resource "aws_iam_policy" "blogs_read_secrets" {
  name   = "${local.blogs_function_name}-read-secrets"
  path   = "/"
  policy = data.aws_iam_policy_document.blogs_read_secrets.json
}

resource "aws_iam_role_policy_attachment" "blogs_read_secrets" {
  policy_arn = aws_iam_policy.blogs_read_secrets.arn
  role       = aws_iam_role.blogs_lambda_role.name
}

## Allow receiving messages from SQS
data "aws_iam_policy_document" "blogs_receive_sqs" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes"
    ]

    resources = [
      aws_sqs_queue.blogs_queue.arn,
    ]
  }
}

resource "aws_iam_policy" "blogs_receive_sqs" {
  name   = "${local.blogs_function_name}-receive-sqs"
  path   = "/"
  policy = data.aws_iam_policy_document.blogs_receive_sqs.json
}

resource "aws_iam_role_policy_attachment" "blogs_receive_sqs" {
  policy_arn = aws_iam_policy.blogs_receive_sqs.arn
  role       = aws_iam_role.blogs_lambda_role.name
}

resource "aws_cloudwatch_log_group" "blogs_function_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.blogs_lambda.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}
