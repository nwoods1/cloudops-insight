package com.cloudops.backend.service;

import com.cloudops.backend.model.Incident;
import com.cloudops.backend.model.Metric;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatService {

    private final DashboardService dashboardService;
    private final BedrockRuntimeClient bedrockRuntimeClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${aws.bedrock.modelId}")
    private String modelId;

    public ChatService(DashboardService dashboardService, BedrockRuntimeClient bedrockRuntimeClient) {
        this.dashboardService = dashboardService;
        this.bedrockRuntimeClient = bedrockRuntimeClient;
    }

    public String askQuestion(String userQuestion) {
        try {
            String context = buildContext(userQuestion);

            Map<String, Object> payloadMap = new HashMap<>();

            List<Map<String, String>> system = List.of(
                    Map.of("text", "You are a cloud operations assistant for CloudOps Insight. Answer only based on the provided system data. Keep answers clear, concise, and practical.")
            );

            List<Map<String, Object>> messages = List.of(
                    Map.of(
                            "role", "user",
                            "content", List.of(
                                    Map.of("text", context)
                            )
                    )
            );

            Map<String, Object> inferenceConfig = new HashMap<>();
            inferenceConfig.put("maxTokens", 400);
            inferenceConfig.put("temperature", 0.3);
            inferenceConfig.put("topP", 0.9);

            payloadMap.put("system", system);
            payloadMap.put("messages", messages);
            payloadMap.put("inferenceConfig", inferenceConfig);

            String payload = objectMapper.writeValueAsString(payloadMap);

            InvokeModelRequest request = InvokeModelRequest.builder()
                    .modelId(modelId)
                    .body(SdkBytes.fromUtf8String(payload))
                    .contentType("application/json")
                    .accept("application/json")
                    .build();

            InvokeModelResponse response = bedrockRuntimeClient.invokeModel(request);
            String responseBody = response.body().asUtf8String();

            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode output = root.path("output").path("message").path("content");

            if (output.isArray() && !output.isEmpty()) {
                JsonNode first = output.get(0);
                if (first.has("text")) {
                    return first.get("text").asText();
                }
            }

            return responseBody;

        } catch (Exception e) {
            throw new RuntimeException("Failed to call Bedrock: " + e.getMessage(), e);
        }
    }

    private String buildContext(String userQuestion) {
        List<Incident> incidents = dashboardService.getAllIncidents();
        List<Metric> metrics = dashboardService.getAllMetrics();

        StringBuilder context = new StringBuilder();

        context.append("You are a cloud operations assistant for CloudOps Insight.\n");
        context.append("Answer based only on the provided system data. Keep answers clear and concise.\n\n");

        context.append("Recent Metrics:\n");
        metrics.stream().limit(20).forEach(metric ->
                context.append(String.format(
                        "Region: %s, Service: %s, Latency: %.2f, Error Rate: %.2f, Uptime: %.2f, Timestamp: %s%n",
                        metric.getRegion(),
                        metric.getServiceName(),
                        metric.getAvgLatency(),
                        metric.getErrorRate(),
                        metric.getUptime(),
                        metric.getTimestamp()
                ))
        );

        context.append("\nRecent Incidents:\n");
        incidents.stream().limit(10).forEach(incident ->
                context.append(String.format(
                        "Incident: %s, Region: %s, Service: %s, Severity: %s, Status: %s, Summary: %s%n",
                        incident.getIncidentId(),
                        incident.getRegion(),
                        incident.getServiceName(),
                        incident.getSeverity(),
                        incident.getStatus(),
                        incident.getSummary()
                ))
        );

        context.append("\nUser question: ").append(userQuestion);

        return context.toString();
    }
}