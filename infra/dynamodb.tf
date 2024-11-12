locals {
  table_name = var.project_name
}

resource "aws_dynamodb_table" "table" {
  name           = local.table_name
  billing_mode   = "PROVISIONED"
  read_capacity  = 10
  write_capacity = 10
  hash_key       = "ArticleId"

  attribute {
    name = "ArticleId"
    type = "S"
  }

  ttl {
    attribute_name = "TimeToExist"
    enabled        = true
  }
}
