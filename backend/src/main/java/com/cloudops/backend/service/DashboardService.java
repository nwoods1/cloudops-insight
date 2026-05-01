package com.cloudops.backend.service;

import com.cloudops.backend.model.Incident;
import com.cloudops.backend.model.Metric;
import com.cloudops.backend.model.RegionSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final DynamoDbClient dynamoDbClient;

    @Value("${aws.dynamodb.incidentsTable}")
    private String incidentsTable;

    @Value("${aws.dynamodb.metricsTable}")
    private String metricsTable;

    public DashboardService(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public List<Incident> getAllIncidents() {
        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(incidentsTable)
                .build();

        ScanResponse response = dynamoDbClient.scan(scanRequest);

        List<Incident> incidents = new ArrayList<>();

        for (Map<String, AttributeValue> item : response.items()) {
            incidents.add(new Incident(
                    item.get("incidentId").s(),
                    item.get("region").s(),
                    item.get("serviceName").s(),
                    item.get("severity").s(),
                    item.get("status").s(),
                    item.get("createdAt").s(),
                    item.get("summary").s()
            ));
        }

        return incidents;
    }

    public List<Metric> getAllMetrics() {
        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(metricsTable)
                .build();

        ScanResponse response = dynamoDbClient.scan(scanRequest);

        List<Metric> metrics = new ArrayList<>();

        for (Map<String, AttributeValue> item : response.items()) {
            metrics.add(new Metric(
                    item.get("metricId").s(),
                    item.get("region").s(),
                    item.get("serviceName").s(),
                    item.get("timestamp").s(),
                    Double.parseDouble(item.get("avgLatency").n()),
                    Double.parseDouble(item.get("errorRate").n()),
                    Double.parseDouble(item.get("uptime").n())
            ));
        }

        return metrics;
    }

    public List<RegionSummary> getRegionSummaries() {
        List<Metric> metrics = getAllMetrics();
        List<Incident> incidents = getAllIncidents();

        List<RegionSummary> summaries = new ArrayList<>();

        for (Metric metric : metrics) {
            int activeIncidentCount = 0;

            for (Incident incident : incidents) {
                if (incident.getRegion().equals(metric.getRegion()) &&
                        !incident.getStatus().equalsIgnoreCase("RESOLVED")) {
                    activeIncidentCount++;
                }
            }

            summaries.add(new RegionSummary(
                    metric.getRegion(),
                    metric.getAvgLatency(),
                    activeIncidentCount,
                    metric.getUptime()
            ));
        }

        return summaries;
    }

    public Incident getIncidentById(String incidentId) {
        return getAllIncidents().stream()
                .filter(incident -> incident.getIncidentId().equalsIgnoreCase(incidentId))
                .findFirst()
                .orElse(null);
    }

    public void createIncident(Incident incident) {
    Map<String, AttributeValue> item = new HashMap<>();
    item.put("incidentId", AttributeValue.builder().s(incident.getIncidentId()).build());
    item.put("region", AttributeValue.builder().s(incident.getRegion()).build());
    item.put("serviceName", AttributeValue.builder().s(incident.getServiceName()).build());
    item.put("severity", AttributeValue.builder().s(incident.getSeverity()).build());
    item.put("status", AttributeValue.builder().s(incident.getStatus()).build());
    item.put("createdAt", AttributeValue.builder().s(incident.getCreatedAt()).build());
    item.put("summary", AttributeValue.builder().s(incident.getSummary()).build());

    PutItemRequest request = PutItemRequest.builder()
            .tableName(incidentsTable)
            .item(item)
            .build();

    dynamoDbClient.putItem(request);
}
}