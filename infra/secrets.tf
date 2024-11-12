locals {
  bsky_secrets = {
    handle : var.bsky_handle
    password : var.bsky_password
  }

  bsky_secrets_name = "bsky_awsblogs_secrets"
}

resource "aws_secretsmanager_secret" "bsky_secrets" {
  name = local.bsky_secrets_name
}

resource "aws_secretsmanager_secret_version" "bsky_password" {
  secret_id     = aws_secretsmanager_secret.bsky_secrets.id
  secret_string = jsonencode(local.bsky_secrets)
}
