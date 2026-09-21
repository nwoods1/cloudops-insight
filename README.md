# CloudOps Insight

CloudOps Insight is a cloud monitoring dashboard that collects, stores, and visualizes AWS service health data to help identify incidents, regional issues, and infrastructure trends.

## Overview

CloudOps Insight was built to simulate a lightweight cloud operations monitoring platform. It combines automated AWS data generation with a Spring Boot REST API and a React dashboard so users can view service metrics, investigate incidents, compare regional health, and export operational data.

The project focuses on full-stack cloud architecture, AWS service integration, backend API design, and presenting infrastructure data in a clear and usable way.

## Key Features

* Automated cloud metric generation using AWS Lambda
* Simulated incident generation and tracking
* Dashboard for viewing infrastructure health and service metrics
* Regional health summaries
* Incident filtering and historical views
* REST API for metrics, incidents, and regional data
* JWT-based authentication protecting the dashboard and API
* DynamoDB persistence for operational data
* Export of incident lists, filtered metrics, and regional summaries to Amazon S3
* AI ops assistant (AWS Bedrock / Amazon Nova) that answers natural-language questions about current metrics and incidents
* Interactive charts and visualizations for monitoring cloud health
* CI workflow using GitHub Actions (build and test on every push/PR)

## Tech Stack

**Frontend:** React, TypeScript, Vite, Recharts

**Backend:** Java, Spring Boot, REST APIs, Jackson, Spring Security, JWT (JJWT)

**AWS:** Lambda, DynamoDB, S3, IAM, Amazon Bedrock (Amazon Nova Lite)

**DevOps:** GitHub Actions (CI: build and test)

## How It Works

1. A user logs in through the React app; the Spring Boot backend validates credentials and issues a JWT used to authenticate subsequent API calls.
2. AWS Lambda functions handle data ingestion: one periodically generates simulated cloud metrics, the other parses incident report files uploaded to S3 into structured records.
3. Metric and incident records are stored in DynamoDB.
4. The Spring Boot backend retrieves and processes the stored operational data.
5. REST endpoints expose metrics, incidents, regional summaries, and chat responses to the frontend.
6. The React application displays the data through dashboards, charts, tables, and regional views, and offers an AI assistant for natural-language questions.
7. When a user asks the assistant a question, the backend builds a context from recent metrics and incidents and sends it to AWS Bedrock (Amazon Nova) to generate an answer.
8. Users can filter operational data and export selected reports or summaries to Amazon S3.

## Architecture

CloudOps Insight is divided into four main layers:

### Frontend

The React and TypeScript frontend provides separate views for:

* Dashboard
* Metrics
* Incidents
* Regions

Recharts is used to visualize service health data and trends.

### Backend

The Spring Boot backend acts as the main application API and handles communication between the frontend and AWS services. A JWT-based Spring Security filter protects all endpoints except login.

The API exposes endpoints for retrieving:

* Metrics
* Incidents
* Regional health information

It also handles export requests (preparing and storing generated reports in S3) and chat requests (building a context from recent operational data and forwarding it to Amazon Bedrock for a natural-language answer).

### Data Layer

CloudOps Insight uses DynamoDB to store operational data.

The main data includes:

* Service metrics
* Incident records
* Regional information

DynamoDB was chosen because it works well with serverless AWS workloads and supports fast access to frequently updated operational data.

### AWS Automation

Two AWS Lambda functions handle data ingestion outside the main application backend:

* A metric generator that creates simulated service health metrics
* An S3-triggered ingestion function that parses uploaded incident report files into structured incident records

This separates automated data generation from the main application backend.

## AWS Infrastructure

### AWS Lambda

Lambda functions generate and ingest the monitoring data used throughout the application.

The metric generator runs to simulate changing service conditions, while the S3-triggered ingestion function parses uploaded incident report files into incident records that can be displayed and investigated through the dashboard.

### DynamoDB

DynamoDB stores generated metrics and incidents.

The backend queries these tables to provide the frontend with current and historical operational data.

### Amazon S3

S3 is used for exporting generated reports and filtered operational data.

Supported exports include:

* Incident lists
* Regional summaries
* Filtered metric data

This allows generated reports to be stored independently from the live application data.

### IAM

IAM permissions control access between the application and AWS resources.

The project uses scoped AWS permissions for services such as:

* DynamoDB
* S3
* Lambda
* Amazon Bedrock

## API

The Spring Boot backend provides REST endpoints for the main dashboard data.

Example resources include:

```text
POST /api/auth/login
GET  /api/metrics
GET  /api/incidents
GET  /api/incidents/{id}
POST /api/incidents
GET  /api/regions/summary
POST /api/chat
POST /api/exports/metrics
POST /api/exports/incidents
POST /api/exports/regions
POST /api/uploads
```

All endpoints except `/api/auth/login` require a valid JWT. These endpoints allow the frontend to retrieve monitoring data, ask the AI assistant questions, and trigger exports without communicating directly with DynamoDB or S3.

## Technical Challenges

### Handling DynamoDB Data Types

DynamoDB returns certain numeric values using AWS-specific representations that did not always map directly to the application's expected Java or JSON types.

The backend handles these values before returning responses to the frontend so the React application receives predictable data structures.

### Managing AWS Permissions

Integrating several AWS services required configuring IAM permissions carefully.

AccessDenied errors during development helped identify which permissions were actually required for Lambda functions and the backend to interact with DynamoDB, S3, and other AWS services.

### Exporting Filtered Data

Exporting data required more than simply uploading an existing file.

The backend first processes the currently selected metrics, incidents, or regional information, generates the appropriate export content, and then stores the resulting file in S3.

### Integrating Multiple AWS Services

The application combines Lambda, DynamoDB, S3, IAM, and Bedrock with a traditional Spring Boot backend.

Keeping each service responsible for a specific part of the system helped prevent the backend from becoming tightly coupled to data generation or storage logic.

### Grounding the AI Assistant in Live Data

Sending a user's question directly to a foundation model was not enough on its own, since the model has no knowledge of the application's current metrics or incidents.

The backend builds a context block from the most recent metrics and incidents in DynamoDB and includes it in the prompt sent to Amazon Bedrock, so answers stay grounded in the current state of the system rather than being generic.

## Engineering Decisions

### Spring Boot for the Backend

Spring Boot provides a structured approach to building REST APIs and makes it easier to separate controllers, services, and AWS integration logic.

It also provided a strong backend foundation for a project involving several external services.

### DynamoDB for Operational Data

Metrics and incidents are generated frequently and do not require a highly relational data model.

DynamoDB provides a simple serverless storage layer that integrates naturally with Lambda and other AWS services.

### Separate Lambda Functions

Metric generation and incident generation are handled independently rather than being part of the Spring Boot application.

This keeps automated background processes separate from the user-facing API and better reflects an event-driven cloud architecture.

### S3 for Exports

Generated reports are stored in S3 instead of inside the application database because they are file-based artifacts rather than live application records.

## Limitations

* Monitoring data is simulated rather than collected from production AWS workloads.
* The project currently focuses on a limited set of services and operational metrics.
* The system is intended as a monitoring-platform prototype rather than a production observability solution.
* Authentication uses a single hardcoded admin credential rather than per-user accounts or role-based access control.
* The JWT signing secret and admin password are currently stored as plaintext application properties rather than in a secrets manager.
* The `infrastructure/` AWS CDK stack is a placeholder; the DynamoDB tables, S3 bucket, and Lambda functions used by the app were provisioned manually rather than through code.
* The CI workflow builds and tests the project but does not deploy it — there is no automated release pipeline.

## Future Improvements

* Connect the platform to real AWS CloudWatch metrics and alarms
* Replace the single hardcoded admin login with per-user accounts and role-based access control
* Move secrets (JWT signing key, credentials) out of application properties and into a secrets manager
* Implement the AWS CDK stack so infrastructure can be deployed and reproduced from code
* Trigger the metric-collector Lambda on a schedule (e.g., EventBridge) instead of running it manually
* Extend CI into a full CD pipeline that deploys to AWS on merge
* Expand monitoring to additional AWS services and regions
* Add automated alerting for abnormal metrics or critical incidents
* Extend the AI assistant with proactive anomaly detection and automated incident summaries
