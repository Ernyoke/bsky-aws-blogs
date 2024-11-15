locals {
  bsky_secrets = {
    handle : var.bsky_handle
    password : var.bsky_password
  }

  bsky_secrets_name = "bsky_awsblogs_secrets"

  deprecations_bsky_secrets = {
    handle : var.bsky_deprecations_handle
    password : var.bsky_deprecations_password
  }

  deprecations_bsky_secrets_name = "bsky_awsblogs_deprecations_secrets"
}

resource "aws_secretsmanager_secret" "bsky_secrets" {
  name = local.bsky_secrets_name
}

resource "aws_secretsmanager_secret_version" "bsky_password" {
  secret_id     = aws_secretsmanager_secret.bsky_secrets.id
  secret_string = jsonencode(local.bsky_secrets)
}

resource "aws_secretsmanager_secret" "deprecations_bsky_secrets" {
  name = local.deprecations_bsky_secrets_name
}

resource "aws_secretsmanager_secret_version" "deprecations_bsky_password" {
  secret_id     = aws_secretsmanager_secret.deprecations_bsky_secrets.id
  secret_string = jsonencode(local.deprecations_bsky_secrets)
}