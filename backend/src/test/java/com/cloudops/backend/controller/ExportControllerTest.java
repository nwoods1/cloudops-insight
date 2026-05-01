package com.cloudops.backend.controller;

import com.cloudops.backend.model.ExportResponse;
import com.cloudops.backend.service.ExportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ExportController.class)
class ExportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExportService exportService;

    @Test
    void exportMetrics_returnsOk() throws Exception {
        when(exportService.exportFilteredMetricsCsv(any(), any(), any(), any()))
                .thenReturn(new ExportResponse(
                        "metrics.csv",
                        "exports/metrics.csv",
                        "https://example.com/metrics.csv",
                        "Export created successfully"
                ));

        mockMvc.perform(post("/api/exports/metrics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "region": "us-east-1",
                                  "serviceName": "auth-service",
                                  "timeFrame": "last24Hours",
                                  "fields": ["region", "serviceName", "avgLatency"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("metrics.csv"))
                .andExpect(jsonPath("$.message").value("Export created successfully"));
    }

    @Test
    void exportIncidents_returnsOk() throws Exception {
        when(exportService.exportIncidentsCsv(any(), any(), any(), any(), any()))
                .thenReturn(new ExportResponse(
                        "incidents.csv",
                        "exports/incidents.csv",
                        "https://example.com/incidents.csv",
                        "Export created successfully"
                ));

        mockMvc.perform(post("/api/exports/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "severity": "HIGH",
                                  "status": "OPEN",
                                  "timeFrame": "last7Days",
                                  "fields": ["incidentId", "severity", "summary"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("incidents.csv"))
                .andExpect(jsonPath("$.message").value("Export created successfully"));
    }

    @Test
    void exportRegions_returnsOk() throws Exception {
        when(exportService.exportRegionSummaryCsv())
                .thenReturn(new ExportResponse(
                        "regions.csv",
                        "exports/regions.csv",
                        "https://example.com/regions.csv",
                        "Export created successfully"
                ));

        mockMvc.perform(post("/api/exports/regions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("regions.csv"))
                .andExpect(jsonPath("$.message").value("Export created successfully"));
    }
}