import boto3
import json
import random
import uuid
from datetime import datetime, timezone

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

METRICS_TABLE = "Metrics"
BUCKET_NAME = "cloudops-insight--uploads"

REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]
SERVICES = ["auth-service", "payment-service", "api-service", "notification-service"]

def generate_metric(region, service_name, timestamp):
    return {
        "metricId": f"METRIC-{uuid.uuid4().hex[:8].upper()}",
        "region": region,
        "serviceName": service_name,
        "timestamp": timestamp,
        "avgLatency": round(random.uniform(80, 250), 2),
        "errorRate": round(random.uniform(0.1, 2.5), 2),
        "uptime": round(random.uniform(98.5, 99.99), 2)
    }

def lambda_handler(event, context):
    table = dynamodb.Table(METRICS_TABLE)
    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    metrics = []

    for region in REGIONS:
        for service in SERVICES:
            metric = generate_metric(region, service, timestamp)
            metrics.append(metric)
            table.put_item(Item=metric)

    s3_key = f"metric-snapshots/{timestamp.replace(':', '-')}.json"

    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=json.dumps(metrics, indent=2),
        ContentType="application/json"
    )

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Mock metrics generated successfully",
            "recordCount": len(metrics),
            "s3Key": s3_key
        })
    }