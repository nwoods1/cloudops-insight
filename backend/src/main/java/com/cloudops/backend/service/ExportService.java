package com.cloudops.backend.service;

import com.cloudops.backend.model.ExportResponse;
import com.cloudops.backend.model.Incident;
import com.cloudops.backend.model.Metric;
import com.cloudops.backend.model.RegionSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class ExportService {

    private final DashboardService dashboardService;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucketName}")
    private String bucketName;

    public ExportService(DashboardService dashboardService, S3Client s3Client, S3Presigner s3Presigner) {
        this.dashboardService = dashboardService;
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    public ExportResponse exportIncidentsCsv(String region, String severity, String status, String timeFrame, List<String> fields) {
        List<Incident> incidents = dashboardService.getAllIncidents();

        if (region != null && !region.isBlank()) {
            incidents = incidents.stream()
                    .filter(incident -> incident.getRegion().equalsIgnoreCase(region))
                    .toList();
        }

        if (severity != null && !severity.isBlank()) {
            incidents = incidents.stream()
                    .filter(incident -> incident.getSeverity().equalsIgnoreCase(severity))
                    .toList();
        }

        if (status != null && !status.isBlank()) {
            incidents = incidents.stream()
                    .filter(incident -> incident.getStatus().equalsIgnoreCase(status))
                    .toList();
        }

        Instant cutoff = getCutoffInstant(timeFrame);
        if (cutoff != null) {
            incidents = incidents.stream()
                    .filter(incident -> {
                        try {
                            return Instant.parse(incident.getCreatedAt()).isAfter(cutoff);
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .toList();
        }

        List<String> selectedFields = (fields == null || fields.isEmpty())
                ? List.of("incidentId", "region", "serviceName", "severity", "status", "createdAt", "summary")
                : fields;

        StringBuilder csv = new StringBuilder();
        csv.append(String.join(",", selectedFields)).append("\n");

        for (Incident incident : incidents) {
            StringBuilder row = new StringBuilder();

            for (int i = 0; i < selectedFields.size(); i++) {
                String field = selectedFields.get(i);

                switch (field) {
                    case "incidentId" -> row.append(escape(incident.getIncidentId()));
                    case "region" -> row.append(escape(incident.getRegion()));
                    case "serviceName" -> row.append(escape(incident.getServiceName()));
                    case "severity" -> row.append(escape(incident.getSeverity()));
                    case "status" -> row.append(escape(incident.getStatus()));
                    case "createdAt" -> row.append(escape(incident.getCreatedAt()));
                    case "summary" -> row.append(escape(incident.getSummary()));
                    default -> row.append("");
                }

                if (i < selectedFields.size() - 1) {
                    row.append(",");
                }
            }

            csv.append(row).append("\n");
        }

        return uploadExport(
                csv.toString(),
                "exports/incidents-" + Instant.now().toEpochMilli() + ".csv",
                "text/csv"
        );
    }

    public ExportResponse exportRegionSummaryCsv() {
        List<RegionSummary> summaries = dashboardService.getRegionSummaries();

        StringBuilder csv = new StringBuilder();
        csv.append("region,avgLatency,activeIncidents,uptime\n");

        for (RegionSummary summary : summaries) {
            csv.append(escape(summary.getRegion())).append(",")
                    .append(summary.getAvgLatency()).append(",")
                    .append(summary.getActiveIncidents()).append(",")
                    .append(summary.getUptime())
                    .append("\n");
        }

        return uploadExport(
                csv.toString(),
                "exports/region-summary-" + Instant.now().toEpochMilli() + ".csv",
                "text/csv"
        );
    }

    public ExportResponse exportFilteredMetricsCsv(String region, String serviceName, String timeFrame, List<String> fields) {
        List<Metric> metrics = dashboardService.getAllMetrics();

        if (region != null && !region.isBlank()) {
            metrics = metrics.stream()
                    .filter(metric -> metric.getRegion().equalsIgnoreCase(region))
                    .toList();
        }

        if (serviceName != null && !serviceName.isBlank()) {
            metrics = metrics.stream()
                    .filter(metric -> metric.getServiceName().equalsIgnoreCase(serviceName))
                    .toList();
        }

        Instant cutoff = getCutoffInstant(timeFrame);
        if (cutoff != null) {
            metrics = metrics.stream()
                    .filter(metric -> {
                        try {
                            return Instant.parse(metric.getTimestamp()).isAfter(cutoff);
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .toList();
        }

        List<String> selectedFields = (fields == null || fields.isEmpty())
                ? List.of("metricId", "region", "serviceName", "timestamp", "avgLatency", "errorRate", "uptime")
                : fields;

        StringBuilder csv = new StringBuilder();
        csv.append(String.join(",", selectedFields)).append("\n");

        for (Metric metric : metrics) {
            StringBuilder row = new StringBuilder();

            for (int i = 0; i < selectedFields.size(); i++) {
                String field = selectedFields.get(i);

                switch (field) {
                    case "metricId" -> row.append(escape(metric.getMetricId()));
                    case "region" -> row.append(escape(metric.getRegion()));
                    case "serviceName" -> row.append(escape(metric.getServiceName()));
                    case "timestamp" -> row.append(escape(metric.getTimestamp()));
                    case "avgLatency" -> row.append(metric.getAvgLatency());
                    case "errorRate" -> row.append(metric.getErrorRate());
                    case "uptime" -> row.append(metric.getUptime());
                    default -> row.append("");
                }

                if (i < selectedFields.size() - 1) {
                    row.append(",");
                }
            }

            csv.append(row).append("\n");
        }

        return uploadExport(
                csv.toString(),
                "exports/metrics-" + Instant.now().toEpochMilli() + ".csv",
                "text/csv"
        );
    }

    private ExportResponse uploadExport(String content, String s3Key, String contentType) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .contentType(contentType)
                .build();

        s3Client.putObject(
                putObjectRequest,
                RequestBody.fromBytes(content.getBytes(StandardCharsets.UTF_8))
        );

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(30))
                .getObjectRequest(getObjectRequest)
                .build();

        String presignedUrl = s3Presigner.presignGetObject(presignRequest)
                .url()
                .toString();

        String fileName = s3Key.substring(s3Key.lastIndexOf("/") + 1);

        return new ExportResponse(
                fileName,
                s3Key,
                presignedUrl,
                "Export created successfully"
        );
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    private Instant getCutoffInstant(String timeFrame) {
    if (timeFrame == null || timeFrame.isBlank() || timeFrame.equalsIgnoreCase("all")) {
        return null;
    }

    Instant now = Instant.now();

    return switch (timeFrame) {
        case "lastHour" -> now.minus(1, ChronoUnit.HOURS);
        case "last24Hours" -> now.minus(24, ChronoUnit.HOURS);
        case "last7Days" -> now.minus(7, ChronoUnit.DAYS);
        case "last30Days" -> now.minus(30, ChronoUnit.DAYS);
        default -> null;
    };
}
}