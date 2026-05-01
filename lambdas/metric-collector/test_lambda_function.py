import json
from unittest.mock import MagicMock, patch

from lambda_function import generate_metric, lambda_handler, REGIONS, SERVICES, BUCKET_NAME


def test_generate_metric_has_expected_fields():
    timestamp = "2026-04-28T20:00:00+00:00"
    metric = generate_metric("us-east-1", "auth-service", timestamp)

    assert "metricId" in metric
    assert metric["metricId"].startswith("METRIC-")
    assert metric["region"] == "us-east-1"
    assert metric["serviceName"] == "auth-service"
    assert metric["timestamp"] == timestamp

    assert "avgLatency" in metric
    assert "errorRate" in metric
    assert "uptime" in metric

    assert isinstance(metric["avgLatency"], float)
    assert isinstance(metric["errorRate"], float)
    assert isinstance(metric["uptime"], float)


def test_generate_metric_values_in_expected_range():
    timestamp = "2026-04-28T20:00:00+00:00"
    metric = generate_metric("us-west-2", "payment-service", timestamp)

    assert 80 <= metric["avgLatency"] <= 250
    assert 0.1 <= metric["errorRate"] <= 2.5
    assert 98.5 <= metric["uptime"] <= 99.99


@patch("lambda_function.s3")
@patch("lambda_function.dynamodb")
def test_lambda_handler_writes_metrics_and_uploads_snapshot(mock_dynamodb, mock_s3):
    mock_table = MagicMock()
    mock_dynamodb.Table.return_value = mock_table

    response = lambda_handler({}, {})

    expected_count = len(REGIONS) * len(SERVICES)

    # Check DynamoDB table was selected correctly
    mock_dynamodb.Table.assert_called_once_with("Metrics")

    # Check put_item was called once per generated metric
    assert mock_table.put_item.call_count == expected_count

    # Check S3 upload happened once
    mock_s3.put_object.assert_called_once()

    # Check response format
    assert response["statusCode"] == 200

    body = json.loads(response["body"])
    assert body["message"] == "Mock metrics generated successfully"
    assert body["recordCount"] == expected_count
    assert body["s3Key"].startswith("metric-snapshots/")
    assert body["s3Key"].endswith(".json")


@patch("lambda_function.s3")
@patch("lambda_function.dynamodb")
def test_lambda_handler_uploads_to_correct_bucket(mock_dynamodb, mock_s3):
    mock_table = MagicMock()
    mock_dynamodb.Table.return_value = mock_table

    lambda_handler({}, {})

    _, kwargs = mock_s3.put_object.call_args

    assert kwargs["Bucket"] == BUCKET_NAME
    assert kwargs["Key"].startswith("metric-snapshots/")
    assert kwargs["ContentType"] == "application/json"


@patch("lambda_function.s3")
@patch("lambda_function.dynamodb")
def test_lambda_handler_s3_body_contains_expected_number_of_metrics(mock_dynamodb, mock_s3):
    mock_table = MagicMock()
    mock_dynamodb.Table.return_value = mock_table

    lambda_handler({}, {})

    _, kwargs = mock_s3.put_object.call_args
    uploaded_body = kwargs["Body"]

    metrics = json.loads(uploaded_body)
    expected_count = len(REGIONS) * len(SERVICES)

    assert isinstance(metrics, list)
    assert len(metrics) == expected_count

    first_metric = metrics[0]
    assert "metricId" in first_metric
    assert "region" in first_metric
    assert "serviceName" in first_metric
    assert "timestamp" in first_metric
    assert "avgLatency" in first_metric
    assert "errorRate" in first_metric
    assert "uptime" in first_metric