from unittest.mock import MagicMock, patch

from lambda_function import parse_incident_text, lambda_handler


def test_parse_incident_text_extracts_expected_fields():
    content = """Service: auth-service
Region: us-east-2
Severity: HIGH
Status: OPEN
Summary: Authentication latency spike detected"""

    parsed = parse_incident_text(content)

    assert parsed["service"] == "auth-service"
    assert parsed["region"] == "us-east-2"
    assert parsed["severity"] == "HIGH"
    assert parsed["status"] == "OPEN"
    assert parsed["summary"] == "Authentication latency spike detected"


def test_parse_incident_text_ignores_lines_without_colon():
    content = """Service: payment-service
This line should be ignored
Region: us-west-2"""

    parsed = parse_incident_text(content)

    assert parsed["service"] == "payment-service"
    assert parsed["region"] == "us-west-2"
    assert "this line should be ignored" not in parsed


def test_parse_incident_text_handles_extra_spaces():
    content = """Service:   api-service
Region:    eu-west-1
Severity:   MEDIUM
Status:   INVESTIGATING
Summary:   API response delays detected"""

    parsed = parse_incident_text(content)

    assert parsed["service"] == "api-service"
    assert parsed["region"] == "eu-west-1"
    assert parsed["severity"] == "MEDIUM"
    assert parsed["status"] == "INVESTIGATING"
    assert parsed["summary"] == "API response delays detected"


@patch("lambda_function.s3")
@patch("lambda_function.dynamodb")
def test_lambda_handler_reads_s3_file_and_writes_incident(mock_dynamodb, mock_s3):
    mock_table = MagicMock()
    mock_dynamodb.Table.return_value = mock_table

    fake_body = MagicMock()
    fake_body.read.return_value = b"""Service: auth-service
Region: us-east-2
Severity: HIGH
Status: OPEN
Summary: Authentication latency spike detected"""

    mock_s3.get_object.return_value = {"Body": fake_body}

    event = {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": "cloudops-insight--uploads"},
                    "object": {"key": "incident-uploads/test-incident.txt"},
                }
            }
        ]
    }

    response = lambda_handler(event, {})

    mock_dynamodb.Table.assert_called_once_with("Incidents")
    mock_s3.get_object.assert_called_once_with(
        Bucket="cloudops-insight--uploads",
        Key="incident-uploads/test-incident.txt"
    )
    mock_table.put_item.assert_called_once()

    _, kwargs = mock_table.put_item.call_args
    item = kwargs["Item"]

    assert item["region"] == "us-east-2"
    assert item["serviceName"] == "auth-service"
    assert item["severity"] == "HIGH"
    assert item["status"] == "OPEN"
    assert item["summary"] == "Authentication latency spike detected"
    assert item["s3Key"] == "incident-uploads/test-incident.txt"
    assert item["incidentId"].startswith("INC-")
    assert "createdAt" in item

    assert response["statusCode"] == 200
    assert response["body"] == "S3 file processed successfully"


@patch("lambda_function.s3")
@patch("lambda_function.dynamodb")
def test_lambda_handler_uses_defaults_for_missing_fields(mock_dynamodb, mock_s3):
    mock_table = MagicMock()
    mock_dynamodb.Table.return_value = mock_table

    fake_body = MagicMock()
    fake_body.read.return_value = b"""Service: notification-service
Region: ap-southeast-1"""

    mock_s3.get_object.return_value = {"Body": fake_body}

    event = {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": "cloudops-insight--uploads"},
                    "object": {"key": "incident-uploads/missing-fields.txt"},
                }
            }
        ]
    }

    lambda_handler(event, {})

    _, kwargs = mock_table.put_item.call_args
    item = kwargs["Item"]

    assert item["region"] == "ap-southeast-1"
    assert item["serviceName"] == "notification-service"
    assert item["severity"] == "LOW"
    assert item["status"] == "OPEN"
    assert item["summary"] == "No summary provided"
    assert item["s3Key"] == "incident-uploads/missing-fields.txt"


@patch("lambda_function.s3")
@patch("lambda_function.dynamodb")
def test_lambda_handler_processes_multiple_s3_records(mock_dynamodb, mock_s3):
    mock_table = MagicMock()
    mock_dynamodb.Table.return_value = mock_table

    fake_body_1 = MagicMock()
    fake_body_1.read.return_value = b"""Service: auth-service
Region: us-east-2
Severity: HIGH
Status: OPEN
Summary: Authentication issue"""

    fake_body_2 = MagicMock()
    fake_body_2.read.return_value = b"""Service: payment-service
Region: us-west-2
Severity: MEDIUM
Status: INVESTIGATING
Summary: Payment delays"""

    mock_s3.get_object.side_effect = [
        {"Body": fake_body_1},
        {"Body": fake_body_2},
    ]

    event = {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": "cloudops-insight--uploads"},
                    "object": {"key": "incident-uploads/incident-1.txt"},
                }
            },
            {
                "s3": {
                    "bucket": {"name": "cloudops-insight--uploads"},
                    "object": {"key": "incident-uploads/incident-2.txt"},
                }
            }
        ]
    }

    response = lambda_handler(event, {})

    assert mock_s3.get_object.call_count == 2
    assert mock_table.put_item.call_count == 2
    assert response["statusCode"] == 200