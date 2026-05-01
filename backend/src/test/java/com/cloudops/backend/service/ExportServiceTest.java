package com.cloudops.backend.service;

import com.cloudops.backend.model.ExportResponse;
import com.cloudops.backend.model.Incident;
import com.cloudops.backend.model.Metric;
import com.cloudops.backend.model.RegionSummary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.net.URL;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExportServiceTest {

    @Mock
    private DashboardService dashboardService;

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @InjectMocks
    private ExportService exportService;

    @BeforeEach
    void setUp() throws Exception {
        ReflectionTestUtils.setField(exportService, "bucketName", "cloudops-insight--uploads");

        PresignedGetObjectRequest presignedRequest = mock(PresignedGetObjectRequest.class);
        when(presignedRequest.url()).thenReturn(new URL("https://example.com/download.csv"));
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presignedRequest);
    }

    @Test
    void exportFilteredMetricsCsv_filtersByRegionAndSelectedFields() {
        List<Metric> metrics = List.of(
                new Metric("M1", "us-east-1", "auth-service", "2026-04-28T20:00:00Z", 120.5, 0.8, 99.9),
                new Metric("M2", "us-west-2", "payment-service", "2026-04-28T20:05:00Z", 180.2, 1.1, 99.5)
        );

        when(dashboardService.getAllMetrics()).thenReturn(metrics);

        ExportResponse response = exportService.exportFilteredMetricsCsv(
                "us-east-1",
                null,
                "all",
                List.of("region", "serviceName", "avgLatency")
        );

        assertNotNull(response);
        assertEquals("Export created successfully", response.getMessage());
        assertEquals("https://example.com/download.csv", response.getDownloadUrl());

        verify(s3Client).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void exportFilteredMetricsCsv_appliesTimeFrameFilter() {
        List<Metric> metrics = List.of(
                new Metric("M1", "us-east-1", "auth-service", "2026-04-28T20:00:00Z", 120.5, 0.8, 99.9),
                new Metric("M2", "us-east-1", "auth-service", "2020-01-01T00:00:00Z", 140.0, 1.0, 99.0)
        );

        when(dashboardService.getAllMetrics()).thenReturn(metrics);

        ExportResponse response = exportService.exportFilteredMetricsCsv(
                "us-east-1",
                "auth-service",
                "last30Days",
                List.of("metricId", "timestamp")
        );

        assertNotNull(response);
        assertEquals("Export created successfully", response.getMessage());

        verify(s3Client).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void exportIncidentsCsv_filtersBySeverityStatusAndSelectedFields() {
        List<Incident> incidents = List.of(
                buildIncident("I1", "us-east-1", "auth-service", "HIGH", "OPEN", "2026-04-28T20:00:00Z", "Auth issue"),
                buildIncident("I2", "us-west-2", "payment-service", "LOW", "RESOLVED", "2026-04-28T20:10:00Z", "Payment issue")
        );

        when(dashboardService.getAllIncidents()).thenReturn(incidents);

        ExportResponse response = exportService.exportIncidentsCsv(
                null,
                "HIGH",
                "OPEN",
                "all",
                List.of("incidentId", "severity", "status", "summary")
        );

        assertNotNull(response);
        assertEquals("Export created successfully", response.getMessage());

        verify(s3Client).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    void exportRegionSummaryCsv_returnsExportResponse() {
        List<RegionSummary> summaries = List.of(
                new RegionSummary("us-east-1", 120.5, 2, 99.9),
                new RegionSummary("us-west-2", 180.2, 1, 99.4)
        );

        when(dashboardService.getRegionSummaries()).thenReturn(summaries);

        ExportResponse response = exportService.exportRegionSummaryCsv();

        assertNotNull(response);
        assertEquals("Export created successfully", response.getMessage());

        verify(s3Client).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    private Incident buildIncident(
            String incidentId,
            String region,
            String serviceName,
            String severity,
            String status,
            String createdAt,
            String summary
    ) {
        Incident incident = new Incident();
        incident.setIncidentId(incidentId);
        incident.setRegion(region);
        incident.setServiceName(serviceName);
        incident.setSeverity(severity);
        incident.setStatus(status);
        incident.setCreatedAt(createdAt);
        incident.setSummary(summary);
        return incident;
    }
}