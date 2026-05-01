package com.cloudops.backend.controller;

import com.cloudops.backend.model.ExportResponse;
import com.cloudops.backend.model.IncidentsExportRequest;
import com.cloudops.backend.model.MetricsExportRequest;
import com.cloudops.backend.service.ExportService;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exports")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @PostMapping("/incidents")
    public ResponseEntity<ExportResponse> exportIncidents(@RequestBody(required = false) IncidentsExportRequest request) {
        String region = request != null ? request.getRegion() : null;
        String severity = request != null ? request.getSeverity() : null;
        String status = request != null ? request.getStatus() : null;
        String timeFrame = request != null ? request.getTimeFrame() : null;
        List<String> fields = request != null ? request.getFields() : null;

        return ResponseEntity.ok(
                exportService.exportIncidentsCsv(region, severity, status, timeFrame, fields)
        );
    }

    @PostMapping("/regions")
    public ResponseEntity<ExportResponse> exportRegionSummaries() {
        return ResponseEntity.ok(exportService.exportRegionSummaryCsv());
    }

    @PostMapping("/metrics")
    public ResponseEntity<ExportResponse> exportMetrics(@RequestBody(required = false) MetricsExportRequest request) {
        String region = request != null ? request.getRegion() : null;
        String serviceName = request != null ? request.getServiceName() : null;
        String timeFrame = request != null ? request.getTimeFrame() : null;
        List<String> fields = request != null ? request.getFields() : null;

        return ResponseEntity.ok(
                exportService.exportFilteredMetricsCsv(region, serviceName, timeFrame, fields)
        );
    }
}