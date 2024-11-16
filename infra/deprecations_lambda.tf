locals {
  deprecations_function_name = "${var.project_name}-deprecations-lambda"
  deprecations_zip_path      = "${path.module}/temp/${local.deprecations_function_name}.zip"
}

resource "aws_lambda_function" "deprecations_lambda" {
  function_name    = local.deprecations_function_name
  handler          = "index.handler"
  memory_size      = 1024
  package_type     = "Zip"
  role             = aws_iam_role.deprecations_lambda_role.arn
  runtime          = "nodejs20.x"
  filename         = local.deprecations_zip_path
  source_code_hash = data.archive_file.deprecations_lambda_zip.output_base64sha256
  timeout          = 60 * 5 // 5 minutes
  architectures    = ["arm64"]
  reserved_concurrent_executions = 1

  environment {
    variables = {
      BSKY_DRY_RUN = var.dry_run
      SECRET_NAME  = aws_secretsmanager_secret.deprecations_bsky_secrets.name
      TABLE_NAME   = aws_dynamodb_table.table.name
      BEDROCK_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"
      BEDROCK_REGION = var.region
    }
  }
}

resource "aws_lambda_function_event_invoke_config" "deprecations_event_invoke_config" {
  function_name                = aws_lambda_function.deprecations_lambda.function_name
  maximum_retry_attempts       = 0
}

data "archive_file" "deprecations_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../${local.deprecations_function_name}/dist"
  output_path = local.deprecations_zip_path
}

resource "aws_lambda_event_source_mapping" "deprecations_event_source_mapping" {
  event_source_arn = aws_sqs_queue.deprecations_queue.arn
  enabled          = true
  function_name    = aws_lambda_function.deprecations_lambda.arn
  batch_size       = 10
}

## Lambda Role
data "aws_iam_policy_document" "deprecations_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "deprecations_lambda_role" {
  assume_role_policy = data.aws_iam_policy_document.deprecations_assume_role.json
  name               = "${local.deprecations_function_name}-role"
}

resource "aws_iam_role_policy_attachment" "deprecations_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.deprecations_lambda_role.name
}

## Allow receiving messages from SQS
data "aws_iam_policy_document" "deprecations_receive_sqs" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes"
    ]

    resources = [
      aws_sqs_queue.deprecations_queue.arn,
    ]
  }
}

resource "aws_iam_policy" "deprecations_receive_sqs" {
  name   = "${local.deprecations_function_name}-receive-sqs"
  path   = "/"
  policy = data.aws_iam_policy_document.deprecations_receive_sqs.json
}

resource "aws_iam_role_policy_attachment" "deprecations_receive_sqs" {
  policy_arn = aws_iam_policy.deprecations_receive_sqs.arn
  role       = aws_iam_role.deprecations_lambda_role.name
}

## Allow access to Secrets Manager
data "aws_iam_policy_document" "deprecations_read_secrets" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetResourcePolicy",
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret",
      "secretsmanager:ListSecretVersionIds"
    ]

    resources = [
      aws_secretsmanager_secret.deprecations_bsky_secrets.arn,
    ]
  }
}

resource "aws_iam_policy" "deprecations_read_secrets" {
  name   = "${local.deprecations_function_name}-read-secrets"
  path   = "/"
  policy = data.aws_iam_policy_document.deprecations_read_secrets.json
}

resource "aws_iam_role_policy_attachment" "deprecations_read_secrets" {
  policy_arn = aws_iam_policy.deprecations_read_secrets.arn
  role       = aws_iam_role.deprecations_lambda_role.name
}

## Invoke Bedrock
data "aws_iam_policy_document" "deprecations_invoke_bedrock" {
  statement {
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel",
      "bedrock:ListFoundationModels"
    ]

    resources = [
      "*",
    ]
  }
}

resource "aws_iam_policy" "deprecations_invoke_bedrock" {
  name   = "${local.deprecations_function_name}-invoke-bedrock"
  path   = "/"
  policy = data.aws_iam_policy_document.deprecations_invoke_bedrock.json
}

resource "aws_iam_role_policy_attachment" "deprecations_invoke_bedrock" {
  policy_arn = aws_iam_policy.deprecations_invoke_bedrock.arn
  role       = aws_iam_role.deprecations_lambda_role.name
}

resource "aws_cloudwatch_log_group" "deprecations_function_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.deprecations_lambda.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}
