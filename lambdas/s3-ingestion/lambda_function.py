import boto3
import uuid
from datetime import datetime, timezone

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

INCIDENTS_TABLE = "Incidents"

def parse_incident_text(file_content: str):
    data = {}
    for line in file_content.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            data[key.strip().lower()] = value.strip()
    return data

def lambda_handler(event, context):
    table = dynamodb.Table(INCIDENTS_TABLE)

    for record in event["Records"]:
        bucket_name = record["s3"]["bucket"]["name"]
        s3_key = record["s3"]["object"]["key"]

        obj = s3.get_object(Bucket=bucket_name, Key=s3_key)
        file_content = obj["Body"].read().decode("utf-8")

        parsed = parse_incident_text(file_content)

        incident_item = {
            "incidentId": f"INC-{uuid.uuid4().hex[:8].upper()}",
            "region": parsed.get("region", "unknown"),
            "serviceName": parsed.get("service", "unknown"),
            "severity": parsed.get("severity", "LOW"),
            "status": parsed.get("status", "OPEN"),
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "summary": parsed.get("summary", "No summary provided"),
            "s3Key": s3_key
        }

        table.put_item(Item=incident_item)

    return {
        "statusCode": 200,
        "body": "S3 file processed successfully"
    }