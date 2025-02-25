locals {
  deprecations_function_name  = "${var.project_name}-deprecations-lambda"
  deprecations_zip_path       = "${path.module}/temp/${local.deprecations_function_name}.zip"
  deprecations_layer_zip_path = "${path.module}/temp/${local.deprecations_function_name}-layer.zip"
  deprecations_lambda_timeout = 60 * 5 // 5 minutes
}

resource "aws_lambda_function" "deprecations_lambda" {
  function_name                  = local.deprecations_function_name
  handler                        = "index.handler"
  memory_size                    = 1024
  package_type                   = "Zip"
  role                           = aws_iam_role.deprecations_lambda_role.arn
  runtime                        = "nodejs20.x"
  filename                       = local.deprecations_zip_path
  source_code_hash               = data.archive_file.deprecations_lambda_zip.output_base64sha256
  timeout                        = local.deprecations_lambda_timeout
  architectures                  = ["arm64"]
  reserved_concurrent_executions = 1
  layers                         = [aws_lambda_layer_version.deprecations_lambda_layer.arn]

  dead_letter_config {
    target_arn = aws_sqs_queue.deprecations_lambda_dlq.arn
  }

  environment {
    variables = {
      BSKY_DRY_RUN        = var.dry_run
      SECRET_NAME         = aws_secretsmanager_secret.deprecations_bsky_secrets.name
      TABLE_NAME          = aws_dynamodb_table.table.name
      NOVA_MICRO_MODEL_ID = "amazon.nova-micro-v1:0"
      NOVA_PRO_MODEL_ID   = "amazon.nova-pro-v1:0"
    }
  }
}

resource "aws_lambda_function_event_invoke_config" "deprecations_event_invoke_config" {
  function_name          = aws_lambda_function.deprecations_lambda.function_name
  maximum_retry_attempts = 0
}

data "archive_file" "deprecations_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../${local.deprecations_function_name}/dist"
  output_path = local.deprecations_zip_path
}

resource "aws_lambda_layer_version" "deprecations_lambda_layer" {
  filename         = "temp/${local.deprecations_function_name}-layer.zip"
  layer_name       = "${local.deprecations_function_name}-layer"
  source_code_hash = data.archive_file.deprecations_lambda_layer_zip.output_base64sha256

  compatible_runtimes = ["nodejs20.x"]
}

data "archive_file" "deprecations_lambda_layer_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../${local.deprecations_function_name}-layer"
  output_path = local.deprecations_layer_zip_path
}

resource "aws_lambda_event_source_mapping" "deprecations_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.deprecations_queue.arn
  enabled                            = true
  function_name                      = aws_lambda_function.deprecations_lambda.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 60
  function_response_types            = ["ReportBatchItemFailures"]
}

# Lambda Role
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

# Allow receiving messages from SQS
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

# Allow access to Secrets Manager
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

# Invoke Bedrock
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

# DLQ for failed async executions
resource "aws_sqs_queue" "deprecations_lambda_dlq" {
  name = "${local.deprecations_function_name}-dlq"
}

# Allow sending failed messages to DLQ
data "aws_iam_policy_document" "deprecations_send_dlq" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage"
    ]

    resources = [
      aws_sqs_queue.deprecations_lambda_dlq.arn,
    ]
  }
}

resource "aws_iam_policy" "deprecations_send_dlq" {
  name   = "${local.fetcher_function_name}-dlq"
  path   = "/"
  policy = data.aws_iam_policy_document.deprecations_send_dlq.json
}

resource "aws_iam_role_policy_attachment" "deprecations_send_dlq" {
  policy_arn = aws_iam_policy.deprecations_send_dlq.arn
  role       = aws_iam_role.deprecations_lambda_role.name
}

resource "aws_cloudwatch_log_group" "deprecations_function_log_group" {
  name              = "/aws/lambda/${aws_lambda_function.deprecations_lambda.function_name}"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}
