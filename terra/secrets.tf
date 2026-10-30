resource "aws_secretsmanager_secret" "rds" {
  name                    = "${var.project_name}/rds/mysql"
  description             = "RDS MySQL credentials"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "rds" {
  secret_id = aws_secretsmanager_secret.rds.id

  secret_string = jsonencode({
    username          = var.db_username
    password          = var.db_password
    host              = aws_db_instance.mysql.address
    port              = aws_db_instance.mysql.port
    dbname            = var.db_name
    connection_string = local.rds_connection_string
  })
}

output "rds_secret_arn" {
  value = aws_secretsmanager_secret.rds.arn
}
