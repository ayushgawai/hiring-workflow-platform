# ECS + CloudWatch (apply in AWS account; not applied by laptop CI)
resource "aws_ecs_cluster" "main" { name = "hiring-workflow" }
resource "aws_cloudwatch_metric_alarm" "api_errors" {
  alarm_name = "hiring-api-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods = 2
  metric_name = "HTTPCode_Target_5XX_Count"
  namespace = "AWS/ApplicationELB"
  period = 60
  statistic = "Sum"
  threshold = 10
  alarm_actions = [] # SNS topic ARN in real account
}
resource "aws_sqs_queue" "jobs" { name = "hiring-jobs" }
resource "aws_sqs_queue" "jobs_dlq" { name = "hiring-jobs-dlq" }
