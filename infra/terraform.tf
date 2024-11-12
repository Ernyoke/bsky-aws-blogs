terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0"
    }
  }

  backend "s3" {
    bucket = "bsky-tf-backend"
    key    = "bsky-aws-blogs"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      "project" : var.project_name
      "managedBy" : "Terraform"
    }
  }
}
